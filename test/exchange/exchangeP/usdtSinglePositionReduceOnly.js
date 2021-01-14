let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

const total = 100000


describe('测试exchangeP usdt合约reduceOnly，单方向持仓，模块仿真',function(){
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


  it('4999买入1btc',function(){
    exchange.registerOrder(Order)
    let res = exchange.buy(4999, 1, {
      reduceOnly: false
    })
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 1584020145982])
    assert.equal( exchange.getAsset('long').getBalance(), 1)
    assert.equal( exchange.getAsset('short').getBalance(), 0)
  })

  it('4999卖出2btc,只成交1BTC',function(){
    //exchange.registerOrder(Order)
    let res = exchange.sell(4999, 2, {
      reduceOnly: true
    })
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4999, 2, 4999.5, 2, 0,0,0,0,0, 1584020145983])
    assert.equal( exchange.getAsset('long').getBalance(), 0)
    assert.equal( exchange.getAsset('short').getBalance(), 0)
  })

  it('4999卖出1btc,成交1BTC',function(){
    //exchange.registerOrder(Order)
    let res = exchange.sell(4999, 1, {
     
    })
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4999, 2, 4999.5, 2, 0,0,0,0,0, 1584020145984])
    assert.equal( exchange.getAsset('long').getBalance(), 0)
    assert.equal( exchange.getAsset('short').getBalance(), 1)
  })

  it('4999买入3btc,成交1BTC',function(){
    //exchange.registerOrder(Order)
    let res = exchange.buy(4999, 3, {
      reduceOnly: true
    })
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4997, 2, 4998, 2, 0,0,0,0,0, 1584020145985])
    assert.equal( exchange.getAsset('long').getBalance(), 0)
    assert.equal( exchange.getAsset('short').getBalance(), 0)
  })


  it('4999买入3btc,成交0BTC',function(){
    //exchange.registerOrder(Order)
    let res = exchange.buy(4999, 3, {
      reduceOnly: true
    })
    events.emit('ROBOT_TICKERS_test_btcusd_p_usdtFutures', [4999, 1, 4997, 2, 4998, 2, 0,0,0,0,0, 1584020145986])
    assert.equal( exchange.getAsset('long').getBalance(), 0)
    assert.equal( exchange.getAsset('short').getBalance(), 0)
  })


 



})
