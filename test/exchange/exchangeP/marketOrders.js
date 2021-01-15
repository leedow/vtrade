let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

const total = 100000


describe('测试exchangeP market类型订单',function(){
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

 

  it('4999买入1btc，成功下单，冻结1*4999usdt',function(){

    exchange.registerOrder(Order)
    let res = exchange.buy(4998, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4998/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].params, {test:1})

  })


  it('测试完整tickers数据成交多单',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4995, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 1584020145978])
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 4999)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })

   
  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), (4999).toFixed(2) )
  })


  it('5000买入1btc，成功下单',function(){

    exchange.registerOrder(Order)
    let res = exchange.buy(4998, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
  
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
 

  })

  it('测试不完整tickers数据成交多单',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4997, 1, 0, 2, 0, 2, 0,0,0,0,0, 1584020145979])
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 4997)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 2 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), ((4999+4997)/2).toFixed(2) )
  })


  it('5000买入1btc，成功下单',function(){

    exchange.registerOrder(Order)
    let res = exchange.buy(4998, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
  
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
 

  })

  it('测试完整depth数据成交多单',function(){
    let depth1 = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}
    
    events.emit('ROBOT_DEPTH_test_btcusd_p_usdtFutures',depth1)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 5806.6)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })

  ///////////////////
  // 空单

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



  it('5000卖出1btc，成功下单',function(){

    exchange.registerOrder(Order)
    let res = exchange.sell(4998, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
  
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
 

  })

  it('测试不完整tickers数据成交空单',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4997, 1, 0, 2, 0, 2, 0,0,0,0,0, 1584020145979])
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 4997)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), -1 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.short.avgPrice.toFixed(2), (4997).toFixed(2) )
  })


  it('卖出1btc，成功下单',function(){
    let res = exchange.sell(4998, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
  
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
 

  })

  it('测试完整tickers数据成交空单',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4997, 1, 5555, 2, 5556, 2, 0,0,0,0,0, 1584020145980])
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 5555)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), -2 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.short.avgPrice.toFixed(2), ((4997+5555)/2).toFixed(2) )
  })




  it('卖出1btc，成功下单',function(){
    let res = exchange.sell(4998.5, 1, {
      type: 'market',
      params: {test:1}
    })
    //console.log(res)
  
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
 

  })

  it('测试完整depth数据成交空单',function(){
    let depth1 = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}
    
    events.emit('ROBOT_DEPTH_test_btcusd_p_usdtFutures',depth1)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 5806.5)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })


})
