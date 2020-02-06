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

  it('添加queue',function(){
    ex.createQueue('q1')

    assert.equal( ex.queues.length, 1)
    assert.equal( ex.getQueue('q1').id, 'q1')

    ex.createQueue('q2')
    assert.equal( ex.queues.length, 2)

    let res= ex.removeQueue('q1')
    assert.equal( res, true)
    assert.equal( ex.queues.length, 1)
    assert.equal( ex.getQueue('q1'), false)
  })

})
