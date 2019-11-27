let assert = require('assert')
let Exchange = require('../../core/exchange/exchange')
let Order = require('../../core/order/order')
let exchange = null

describe('测试exchange模块',function(){

  it('初始化exchange及资产账户',function(){

    exchange = new Exchange({
      name: 'test',
      pair: 'btcusdt',
      from : 'usdt',
      to: 'btc',
      makerFee: -0.01,
      takerFee: 0.01
    })

    assert.equal( exchange.getAsset('btc').name, 'btc')
    assert.equal( exchange.getAsset('usdt').name, 'usdt')
    assert.equal( exchange.getAsset('btc').balance, 0)
    assert.equal( exchange.getAsset('usdt').balance, 0)
  })

  it('设置资产账户余额',function(){
    exchange.getAsset('btc').balance = 1
    exchange.getAsset('usdt').balance = 8000

    assert.equal( exchange.getAsset('btc').balance, 1)
    assert.equal( exchange.getAsset('usdt').balance, 8000)
  })

  it('6000买入1.5BTC',function(){
    exchange.registerOrder(Order)
    exchange.buy(6000, 1.5)
    assert.equal( exchange.getAsset('usdt').getFrozen(), 6000)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)

  })

  it('继续6000买入1.5BTC，余额不足',function(){
    exchange.buy(6000, 1.5)
    assert.equal( exchange.getAsset('usdt').getAvailable(), 2000)
    assert.equal( exchange.getAsset('usdt').getFrozen(), 6000)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

})
