let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

const total = 100000


describe('测试exchangeP usdt合约，单方向持仓，模块仿真',function(){
  const TAKER_FEE = 0.02
  const MAKER_FEE = -0.01

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusd_p',
      balance : 'usdt',
      product: 'usdtFutures',
      makerFee: MAKER_FEE,
      takerFee: TAKER_FEE,
      amountAcc: 2,
      priceAcc: 4,
      lever: LEVER,
      marginType: 'usd',
      dualSidePosition: false
    })

    assert.equal( exchange.getAsset('usdt').name, 'usdt')
    assert.equal( exchange.getAsset('long').name, 'long')
    assert.equal( exchange.getAsset('short').name, 'short')

    assert.equal( exchange.getAsset('usdt').balance, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)

  })

  it('设置资产账户余额',function(){
    exchange.getAsset('usdt').balance = total
    assert.equal( exchange.getAsset('usdt').balance, total)
  })

  

  it('测试tickers数据订阅时间一',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
    assert.deepEqual( exchange.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
  })



  it('测试ex时钟',function(){
    assert.deepEqual( exchange.clock.time, 1584020145972)
  })



  it('测试tickers数据订阅时间二',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
  })

  it('测试ex时钟更新',function(){
    assert.deepEqual( exchange.clock.time, 1584020145976)
  })

  it('测试trades数据订阅',function(){
    events.emit('ROBOT_TRADES_test_btcusd_p_usdtFutures', [5864,3000,"buy",1584020145972])
    assert.deepEqual( exchange.trades.getLast(1), [5864,3000,"buy",1584020145972])
    events.emit('ROBOT_TRADES_test_btcusd_p_usdtFutures', [5864,4000,"buy",1584020145973])
    assert.deepEqual( exchange.trades.getLast(1), [5864,4000,"buy",1584020145973])
  })


  it('4999买入1btc，成功下单，冻结1*4999usdt',function(){

    exchange.registerOrder(Order)
    let res = exchange.buy(4999, 1, {
      params: {test:1}
    })
    //console.log(res)
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    //console.log(exchange.orders[exchange.orders.length-1].params)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].params, {test:1})

  })

  

  it('测试order createTime',function(){
    assert.deepEqual( exchange.orders[exchange.orders.length-1].createTime, 1584020145976)
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 4999)
    assert.equal( exchange.getBottomSellOrder(), null)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })



  it('继续5001买入1btc多单，成功下单，冻结1*5001usdt',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145977])
    exchange.buy(5001, 1)
    assert.equal( exchange.getAsset('usdt').getAvailable(10), (total-1*4999/LEVER-1*5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })


  it('测试order createTime',function(){
    assert.deepEqual( exchange.orders[exchange.orders.length-2].createTime, 1584020145976)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].createTime, 1584020145977)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder(), null)
  })



  it('继续5001买入200btc，资金不足，买入失败',function(){
    let res = exchange.buy(5001, 200)
    assert.equal( exchange.getAsset('usdt').getAvailable(10), (total-1*4999/LEVER-1*5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
    assert.equal( res.errCode, NO_BALANCE)

  })

  

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('4999卖出1btc，成功下单，冻结1*4999usdt',function(){
    exchange.sell(4999, 1)
    assert.equal( exchange.getAsset('usdt').getFrozen(10),  (1*4999/LEVER+1*5001/LEVER+1*4999/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })

  

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 1)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  

  it('5001卖出2btc，成功下单，冻结2*5001usdt',function(){
    exchange.sell(5001, 2)
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER+1*4999/LEVER+2*5001/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
  })


  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 3)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  it('7000继续卖出1btc',function(){ // 0.9995
    exchange.sell(7000, 1)
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER+1*4999/LEVER+2*5001/LEVER+1*7000/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 5)
  })

  

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  // 5001买 1  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4998-5001，taker成交5001买单',function() {
    const PRE_FROZEN = exchange.getAsset('usdt').getFrozen()
    const PRE_BALANCE = exchange.getAsset('usdt').getBalance()
    const PRICE = 5001
    const FEE = 1*PRICE*TAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5000, 1, 4998, 2, 5001, 2, 0,0,0,0,0, 1584020145982])
    //events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
    assert.equal( exchange.getOrdersByStatus(4).length, 1)

    assert.equal( exchange.long.avgPrice, 5001)
    assert.equal( exchange.long.deposit,  1*PRICE/LEVER )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 1)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('usdt').getFrozen(10).toFixed(10), (PRE_FROZEN).toFixed(10) )
    assert.equal( exchange.getAsset('usdt').balance, PRE_BALANCE-FEE )
  })

  it('测试实时杠杆',function(){
    assert.equal( exchange.getPositionLever(), 1/(exchange.getBalance()/5000))
  })

  

  it('测试order finishTime',function(){
    assert.deepEqual( exchange.orders[1].finishTime, 1584020145982)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 3+1)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  

  

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4999-5001，maker成交4999卖单',function() {
    const PRE_FROZEN = exchange.getAsset('usdt').getFrozen()
    const PRE_BALANCE = exchange.getAsset('usdt').getBalance()
    const PRICE = 4999
    const FEE = 1*PRICE*MAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
    assert.equal( exchange.getOrdersByStatus(4).length, 2)

    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)
    //assert.equal( exchange.getAsset('btc').getFrozen(10).toFixed(10), (PRE_FROZEN-1/PRICE/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usdt').balance, PRE_BALANCE-FEE-(1*5001-1*4999) )
  })


  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 3+1-1)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  it('测试多空仓位对消',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试实时杠杆',function(){
    assert.equal( exchange.getPositionLever(), 0)
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 4999)
    assert.equal( exchange.getBottomSellOrder().price, 5001)
  })

  it('测试depth数据订阅',function(){
    let depth = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}


    events.emit('ROBOT_DEPTH_test_btcusd_p_usdtFutures', depth)
    assert.deepEqual( exchange.depth.getLast(1), depth)
    //events.emit('ROBOT_DEPTH_test_btcusd_p_usdtFutures', [5864,4000,"buy",1584020145973])
    //assert.deepEqual( exchange.depth.getLast(1), [5864,4000,"buy",1584020145973])
  })

  it('测试reduceOnly赋值',function(){
    let order1 = exchange.buy(5001, 20000, {
      reduceOnly: true
    })
    let order2 = exchange.buy(5001, 20000, {
      
    })

    assert.deepEqual( order1.order.reduceOnly, true)
    assert.deepEqual( order2.order.reduceOnly, false)

  })

  it('测试timeInForce赋值',function(){
    let order1 = exchange.buy(5001, 20000, {
      timeInForce: 'test'
    })
    

    assert.deepEqual( order1.order.timeInForce, 'test')
  })




})
