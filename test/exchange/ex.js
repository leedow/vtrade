var assert = require('assert')
var Ex = require('../../core/exchange/ex')

let ex = new Ex()

describe('测试ex模块',function(){

  it('添加获取asset',function(){
    ex.createAsset('btc', 100)
    ex.createAsset('usdt', 200)

    assert.equal( ex.getAsset('btc').name, 'btc')
    assert.equal( ex.getAsset('usdt').name, 'usdt')
    assert.equal( ex.getAsset('btc').balance, 100)
    assert.equal( ex.getAsset('usdt').balance, 200)
  })

})
