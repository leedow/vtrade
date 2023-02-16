let assert = require('assert')
let Exchange = require('../../../core/exchange/exchange')
let Order = require('../../../core/order/order')
let events = require('../../../core/common/events')
let exchange = null

describe('测试exchange模块 market类型订单',function(){
  return

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusdt',
      from : 'usdt',
      to: 'btc',
      makerFee: -0.01,
      takerFee: 0.01,
      amountAcc: 2,
      priceAcc: 4,
      product: 'spot'
    })

    assert.equal( exchange.getAsset('btc').name, 'btc')
    assert.equal( exchange.getAsset('usdt').name, 'usdt')
    assert.equal( exchange.getAsset('btc').balance, 0)
    assert.equal( exchange.getAsset('usdt').balance, 0)
  })

  it('设置资产账户余额',function(){
    exchange.getAsset('btc').balance = 1
    exchange.getAsset('usdt').balance = 10000

    assert.equal( exchange.getAsset('btc').balance, 1)
    assert.equal( exchange.getAsset('usdt').balance, 10000)
  })

  it('4999买入1btc，成功下单，冻结1*4999usdt',function() {

    exchange.registerOrder(Order)
    let res = exchange.buy(4998, 1, {
      type: 'market'
    })
    //console.log(res)
    assert.equal( exchange.getAsset('usdt').getFrozen(), 4998)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
   // assert.deepEqual( exchange.orders[exchange.orders.length-1].params, {test:1})

  })


 

  it('测试完整tickers数据成交多单',function(){
    events.emit('ROBOT_TICKERS_test_btcusdt_spot', [4995, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 1584020145978])
    assert.deepEqual( exchange.orders[exchange.orders.length-1].priceFill, 4999)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].status, 4)
  })

   
 
   
  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  it('测试仓位价格',function(){
    assert.equal( exchange.long.avgPrice.toFixed(2), (4999).toFixed(2) )
  })

return
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

})
