var assert = require('assert')
var Exchange = require('../../core/exchange/exchange')

let exchange = null

describe('测试exchange模块',function(){

  it('初始化exchange及资产账户',function(){

    exchange = new Exchange({
      name: 'test',
      pair: 'btcusdt',
      from : 'usdt',
      to: 'btc'
    })

    assert.equal( exchange.getAsset('btc').name, 'btc')
    assert.equal( exchange.getAsset('usdt').name, 'usdt')
    assert.equal( exchange.getAsset('btc').balance, 0)
    assert.equal( exchange.getAsset('usdt').balance, 0)
  })

  it('设置资产账户余额为100',function(){
    exchange.getAsset('btc').balance = 100
    exchange.getAsset('usdt').balance = 100

    assert.equal( exchange.getAsset('btc').balance, 100)
    assert.equal( exchange.getAsset('usdt').balance, 100)
  })

})
