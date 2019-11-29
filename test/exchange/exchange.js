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
      takerFee: 0.01,
      amountAcc: 2,
      priceAcc: 4
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

  it('测试tickers数据订阅',function(){
    events.emit('TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5001, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2])
    events.emit('TICKERS_test_btcusdt', [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2])

  })

  it('4999买入0.1BTC，成功下单，冻结499.9USDT',function(){
    exchange.registerOrder(Order)
    exchange.buy(4999, 0.1)
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 499.9)
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

  it('继续5001买入0.1BTC，成功下单，冻结500.1USDT',function(){
    exchange.buy(5001, 0.1)
    assert.equal( exchange.getAsset('usdt').getAvailable(2), 10000-499.9-500.1)
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 500.1 + 499.9)
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('继续5001买入10BTC，资金不足，买入失败',function(){
    exchange.buy(5001, 10)
    assert.equal( exchange.getAsset('usdt').getAvailable(2), 10000-499.9-500.1)
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 500.1 + 499.9)
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('4999卖出0.1BTC，成功下单，冻结0.1BTC',function(){
    exchange.sell(4999, 0.1)
    assert.equal( exchange.getAsset('btc').getFrozen(2), 0.1)
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })

  it('5001卖出0.1BTC，成功下单，冻结0.1BTC',function(){
    exchange.sell(5001, 0.1)
    assert.equal( exchange.getAsset('btc').getFrozen(2), 0.2)
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
  })

  it('7000继续卖出10BTC，余额不足',function(){
    exchange.sell(7000, 10)
    assert.equal( exchange.getAsset('btc').getFrozen(2), 0.2)
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
  })

  // 5001买 0.1  5001卖 0.1
  // 4999买 0.1  4999卖 0.1
  it('价格波动至4999-5001，taker成交4999卖单，5001买单',function() {
    let usdt = exchange.getAsset('usdt').getBalance()
    let btc = exchange.getAsset('btc').getBalance()

    events.emit('TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5001, 2])
    events.emit('TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5001, 2])

    assert.equal( exchange.getAsset('btc').getFrozen(4), 0.1)
    assert.equal( exchange.getAsset('btc').getBalance(4), 1-0.1+0.1*0.99)
    assert.equal( exchange.getAsset('btc').getAvailable(4), 1-0.1+0.1-0.1*0.01-0.1)

    assert.equal( exchange.getAsset('usdt').getFrozen(4), 499.9 )
    assert.equal( exchange.getAsset('usdt').getBalance(4), 10000-500.1+0.1*4999*0.99)
    assert.equal( exchange.getAsset('usdt').getAvailable(4), 10000-500.1+0.1*4999*0.99-499.9)

    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
    assert.equal( exchange.getOrdersByStatus(4).length, 2)
  })

  // 5001卖 0.1
  // 4999买 0.1
  it('价格波动至5001-5002，maker成交5001卖单',function() {
    let usdt = exchange.getAsset('usdt').getBalance()
    let btc = exchange.getAsset('btc').getBalance()

    events.emit('TICKERS_test_btcusdt', [5001, 1, 5001, 2, 5002, 2])

    assert.equal( exchange.getAsset('btc').getFrozen(4), 0.1-0.1)
    assert.equal( exchange.getAsset('btc').getBalance(4), 1-0.1+0.1*0.99-0.1)
    assert.equal( exchange.getAsset('btc').getAvailable(4), 1-0.1+0.1*0.99-0.1)
    //
    assert.equal( exchange.getAsset('usdt').getFrozen(4), 499.9 )
    assert.equal( exchange.getAsset('usdt').getBalance(4), 10000-500.1+0.1*4999*0.99 + 0.1*5001*1.01)
    assert.equal( exchange.getAsset('usdt').getAvailable(4), 10000-500.1+0.1*4999*0.99-499.9+ 0.1*5001*1.01)

    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    assert.equal( exchange.getOrdersByStatus(4).length, 3)
  })


  // 4999买 0.1
  it('价格波动至4999-5000，无订单成交',function() {
    events.emit('TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5000, 2])
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    assert.equal( exchange.getOrdersByStatus(4).length, 3)
  })

  // 4999买 0.1
  it('价格波动至4997-4998，maker成交4999买单',function() {
    events.emit('TICKERS_test_btcusdt', [5000, 1, 4997, 2, 4998, 2])

    assert.equal( exchange.getAsset('btc').getFrozen(4), 0)
    assert.equal( exchange.getAsset('btc').getBalance(4), 1-0.1+0.1*0.99-0.1+0.1*1.01)
    assert.equal( exchange.getAsset('btc').getAvailable(4), 1-0.1+0.1*0.99-0.1+0.1*1.01)

    assert.equal( exchange.getAsset('usdt').getFrozen(4), 499.9-499.9 )
    assert.equal( exchange.getAsset('usdt').getBalance(4), 10000-500.1+0.1*4999*0.99 + 0.1*5001*1.01-499.9)
    assert.equal( exchange.getAsset('usdt').getAvailable(4), 10000-500.1+0.1*4999*0.99-499.9+ 0.1*5001*1.01)

    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 0)
    assert.equal( exchange.getOrdersByStatus(4).length, 4)
  })

  it('6000卖出0.1BTC，成功下单，冻结0.1BTC',function(){
    exchange.sell(6000, 0.1)
    assert.equal( exchange.getAsset('btc').getFrozen(2), 0.1)
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

  it('3000买入0.1BTC，成功下单，冻结300USDT',function(){
    exchange.buy(3000, 0.01)
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 30)
    assert.equal( exchange.getOrdersLength(), 6)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  events.emit('TICKERS_test_btcusdt', [4998, 1, 4994, 2, 4999, 2])

  it('取消买单',function(){
    exchange.getOrdersByStatus(2).forEach(order => {
      if(order.side == 'buy') {
        order.cancel()
      }
    })
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 0)
    assert.equal( exchange.getOrdersLength(), 6)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    assert.equal( exchange.getOrdersByStatus(6).length, 1)
  })

  it('取消卖单',function(){
    exchange.getOrdersByStatus(2).forEach(order => {
      if(order.side == 'sell') {
        order.cancel()
      }
    })
    assert.equal( exchange.getAsset('usdt').getFrozen(2), 0)
    assert.equal( exchange.getAsset('btc').getFrozen(2), 0)
    assert.equal( exchange.getOrdersLength(), 6)
    assert.equal( exchange.getOrdersByStatus(2).length, 0)
    assert.equal( exchange.getOrdersByStatus(6).length, 2)
  })

})
