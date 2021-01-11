let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

describe('测试exchangeP币本位模块独立方法',function(){
  let ex = new Exchange({
    name: 'test',
    exchange: 'test',
    pair: 'btcusd_p',
    balance : 'btc',
    makerFee: -0.01,
    takerFee: 0.01,
    amountAcc: 2,
    priceAcc: 4,
    lever: LEVER
  })

  ex.getAsset('btc').balance = 100


  it('增加多仓',function(){
    ex.increasePosition('long', 100.123, 1.11, 1.321)
    assert.equal( ex.getAsset('long').balance, 1.11)
    assert.equal( ex.long.avgPrice, 100.123)
    assert.equal( ex.long.deposit, 1.321)
    assert.equal( ex.getAsset('btc').balance, 100)
    // assert.equal( ex.getAsset('btc').getFrozen(), ex.long.deposit)
  })

  it('继续增加多仓',function(){
    ex.increasePosition('long', 99.9, 2.11, 2.321)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, 1.321+2.321)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('平多部分',function(){
    ex.decreasePosition('long', 99.8, 1, 0)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11-1)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, (1.321+2.321)*(1.11+2.11-1)/(1.11+2.11) )
    assert.equal( ex.getAsset('btc').balance, 100 )
  })

  it('清空多仓',function(){
    ex.clearPosition('long', 0)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
  })

  it('开空1',function(){
    ex.increasePosition('short',100, 1, 1)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.short.avgPrice, 100)
    assert.equal( ex.short.deposit, 1)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('继续开空1',function(){
    ex.increasePosition('short',102, 1, 1)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 2)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('清空空仓',function(){
    ex.clearPosition('short', 0)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
  })

  // 测试 updateAssets 逻辑C
  it('订单开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'long',
      deposit: 1/100/LEVER,
      fee: 1
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit, 1/100/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1)
  })

  // 逻辑C
  it('订单再次开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'long',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, 1/100/LEVER+1/102/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 2)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1)
  })

  // 逻辑E
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, ( 1/100/LEVER+1/102/LEVER )*0.5  )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1  + 1/101-1/102  )
  })

  // 逻辑D
  it('开空2',function(){
    ex.updateAssets({
      amountFill: 2,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 102)
    assert.equal( ex.short.deposit, 1/102/LEVER/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  )
  })

  // 逻辑F
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'short',
      deposit: 1/100/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 1/102/LEVER/2 + 1/100/LEVER)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102) )
  })

  // 逻辑B
  it('开多1',function(){
    const PRICE = 103
    ex.updateAssets({
      amountFill: 1,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 1/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, (1/102/LEVER/2 + 1/100/LEVER)/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  + (1/PRICE -1/101) )
  })

  // 逻辑B
  it('开多2',function(){
    const PRICE = 100
    const PRE_BALANCE = ex.getAsset('btc').balance
    ex.updateAssets({
      amountFill: 2,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 2/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit,  1/PRICE/LEVER )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, PRE_BALANCE+1/100-1/101)
  })


})



describe('测试exchangeP币本位模块仿真',function(){
  const TAKER_FEE = 0.01
  const MAKER_FEE = -0.01

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusd_p',
      balance : 'btc',
      product: 'spot',
      makerFee: MAKER_FEE,
      takerFee: TAKER_FEE,
      amountAcc: 2,
      priceAcc: 4,
      lever: LEVER
    })

    assert.equal( exchange.getAsset('btc').name, 'btc')
    assert.equal( exchange.getAsset('long').name, 'long')
    assert.equal( exchange.getAsset('short').name, 'short')

    assert.equal( exchange.getAsset('btc').balance, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)

  })

  it('设置资产账户余额',function(){
    exchange.getAsset('btc').balance = 1
    assert.equal( exchange.getAsset('btc').balance, 1)
  })

  it('测试tickers数据订阅时间一',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
    assert.deepEqual( exchange.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
  })

  it('测试getPrice',function(){
    //events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
    assert.deepEqual( exchange.getPrice(), 5000)
  })

  it('测试ex时钟',function(){
    assert.deepEqual( exchange.clock.time, 1584020145972)
  })

  it('测试tickers数据订阅时间二',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
  })

  it('测试ex时钟更新',function(){
    assert.deepEqual( exchange.clock.time, 1584020145976)
  })

  it('测试trades数据订阅',function(){
    events.emit('ROBOT_TRADES_test_btcusd_p_spot', [5864,3000,"buy",1584020145972])
    assert.deepEqual( exchange.trades.getLast(1), [5864,3000,"buy",1584020145972])
    events.emit('ROBOT_TRADES_test_btcusd_p_spot', [5864,4000,"buy",1584020145973])
    assert.deepEqual( exchange.trades.getLast(1), [5864,4000,"buy",1584020145973])
  })

  it('4999买入1USD，成功下单，冻结1/4999btc',function(){

    exchange.registerOrder(Order)
    exchange.buy(4999, 1, {
      params: {test:1}
    })
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER).toFixed(10))
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

  it('继续5001买入1usd多单，成功下单，冻结1/5001btc',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145977])
    exchange.buy(5001, 1)
    assert.equal( exchange.getAsset('btc').getAvailable(10), (1-1/4999/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER).toFixed(10))
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

  it('继续5001买入20000usd，资金不足，买入失败',function(){
    let res = exchange.buy(5001, 20000)
    assert.equal( exchange.getAsset('btc').getAvailable(10), (1-1/4999/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER).toFixed(10))
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

  it('4999卖出1usd，成功下单，冻结1/4999btc',function(){
    exchange.sell(4999, 1)
    assert.equal( exchange.getAsset('btc').getFrozen(10),  (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER).toFixed(10) )
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

  it('5001卖出2usd，成功下单，冻结2/5001btc',function(){
    exchange.sell(5001, 2)
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER+2/5001/LEVER).toFixed(10) )
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

  it('7000继续卖出10000usd',function(){ // 0.9995
    exchange.sell(7000, 10000)
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER+2/5001/LEVER+10000/7000/LEVER).toFixed(10) )
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
    const PRE_FROZEN = exchange.getAsset('btc').getFrozen()
    const PRE_BALANCE = exchange.getAsset('btc').getBalance()
    const PRICE = 5001
    const FEE = 1/PRICE*TAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5000, 1, 4998, 2, 5001, 2, 0,0,0,0,0, 1584020145982])
    //events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
    assert.equal( exchange.getOrdersByStatus(4).length, 1)

    assert.equal( exchange.long.avgPrice, 5001)
    assert.equal( exchange.long.deposit,  1/PRICE/LEVER )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 1)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('btc').getFrozen(10).toFixed(10), (PRE_FROZEN).toFixed(10) )
    assert.equal( exchange.getAsset('btc').balance, PRE_BALANCE-FEE )
  })

  it('测试实时杠杆',function(){
    assert.equal( exchange.getPositionLever(), 1/(exchange.getBalance()*5000))
  })

  it('测试order finishTime',function(){
    assert.deepEqual( exchange.orders[1].finishTime, 1584020145982)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 3+10000)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4999-5001，maker成交4999卖单',function() {
    const PRE_FROZEN = exchange.getAsset('btc').getFrozen()
    const PRE_BALANCE = exchange.getAsset('btc').getBalance()
    const PRICE = 4999
    const FEE = 1/PRICE*MAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p_spot', [5000, 1, 4999, 2, 5001, 2])
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
    assert.equal( exchange.getAsset('btc').balance, PRE_BALANCE-FEE+(1/5001-1/4999) )
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 3+10000-1)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  it('测试多空仓位对消',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 4999)
    assert.equal( exchange.getBottomSellOrder().price, 5001)
  })

  it('测试depth数据订阅',function(){
    let depth = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}


    events.emit('ROBOT_DEPTH_test_btcusd_p_spot', depth)
    assert.deepEqual( exchange.depth.getLast(1), depth)
    //events.emit('ROBOT_DEPTH_test_btcusd_p_spot', [5864,4000,"buy",1584020145973])
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
