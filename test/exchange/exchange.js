let assert = require('assert')
let Exchange = require('../../core/exchange/exchange')
let Order = require('../../core/order/order')
let events = require('../../core/common/events')
let exchange = null

describe('测试exchange模块',function(){

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
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

  it('测试tickers数据订阅',function(){
    events.emit('TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5001, 2])

    assert.equal( exchange.getAsset('btc').balance, 1)
    assert.equal( exchange.getAsset('usdt').balance, 8000)
  })

  it('3000买入1.5BTC，成功下单',function(){
    exchange.registerOrder(Order)
    exchange.buy(3000, 1.5)
    assert.equal( exchange.getAsset('usdt').getFrozen(), 3000*1.5)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

  it('继续3000买入3BTC，余额不足',function(){
    exchange.buy(3000, 3)
    assert.equal( exchange.getAsset('usdt').getAvailable(),3500)
    assert.equal( exchange.getAsset('usdt').getFrozen(), 3000*1.5)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

  it('7000卖出1BTC，成功下单',function(){
    exchange.sell(7000, 1)
    assert.equal( exchange.getAsset('btc').getFrozen(), 1)
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('7000继续卖出1BTC，余额不足',function(){
    exchange.sell(7000, 1)
    assert.equal( exchange.getAsset('btc').getFrozen(), 1)
    assert.equal( exchange.getAsset('btc').getBalance(), 1)
    assert.equal( exchange.getAsset('btc').getAvailable(), 0)
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('价格波动，taker成交卖单',function(){
    assert.equal( exchange.getAsset('btc').getFrozen(), 1)
    assert.equal( exchange.getAsset('btc').getBalance(), 1)
    assert.equal( exchange.getAsset('btc').getAvailable(), 0)
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

})
