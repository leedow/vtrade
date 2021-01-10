let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

const total = 100000


describe('测试exchangeP usdt合约，单方向持仓，开平仓仓位及持仓价变化',function(){
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



  it('测试tickers数据订阅时间二',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145976])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2, 0,0,0,0,0, 1584020145972])
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

  
  it('继续5001买入2btc多单，成功下单，冻结2*5001usdt',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5001, 1, 4999.5, 2, 5001.2, 2, 0,0,0,0,0, 1584020145977])
    exchange.buy(5001, 2)
    //assert.equal( exchange.getAsset('usdt').getAvailable(10), (total-1*4999/LEVER-1*5001/LEVER).toFixed(10) )
    //assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })


  it('成交所有多单',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 1584020145978])
   //assert.deepEqual( exchange.tickers.getLast(2), [4999, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 158402014597])
    
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 0)
    
    //assert.equal( exchange.getPosition(), 2)
    //assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 3 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), ((4999+5001*2)/3).toFixed(2) )
  })

  it('4999卖出1btc，成功下单，冻结1*4999usdt',function(){
    exchange.sell(4999, 1)
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 3  )
  })


  it('5001卖出3btc，成功下单，冻结3*5001usdt',function(){
    exchange.sell(5001, 3)
  })
 

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('成交所有卖单',function() {
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5001, 1, 5001, 2, 5002, 2])
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 0)
    
  })


  it('测试多空仓位对消',function(){
    assert.equal( exchange.getPosition(), -1 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), 0 )
    assert.equal( exchange.short.avgPrice.toFixed(2), 5001 )

  })

  
  it('5001买入3BTC',function(){
    exchange.buy(5001, 3)
  })
 

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('成交所有买单',function() {
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [5000, 1, 5000, 2, 5001, 2])
    
  })

  it('测试多空仓位对消',function(){
    assert.equal( exchange.getPosition(), 2 )
  })


  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), 5001 )
    assert.equal( exchange.short.avgPrice.toFixed(2), 0 )
  })





})
