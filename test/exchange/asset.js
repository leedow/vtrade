var assert = require('assert')
var Asset = require('../../core/exchange/asset')

let asset = new Asset('test',1000 )
asset.balance = 1000
asset.enableLog = false
asset.enableError = false
describe('测试asset模块',function(){

  it('初始化balance',function(){
    // asset.balance = 1000
    assert.equal( asset.getAvailable(), 1000)
  })

  it('冻结允许金额',function(){
    asset.frozen(500.5)
    assert.equal( asset.getAvailable(), 499.5)
  })

  it('冻结超额金额',function(){
    asset.frozen(2000)
    assert.equal( asset.getAvailable(), 499.5)
  })

  it('减少少于冻结资产',function(){
    asset.decrease(100)
    assert.equal( asset.getFrozen(), 400.5)
    assert.equal( asset.getBalance(), 900)
    assert.equal( asset.getAvailable(), 499.5)
  })

  it('减少高于冻结资产',function(){
    asset.decrease(500)
    assert.equal( asset.getFrozen(), 0)
    assert.equal( asset.getBalance(), 400)
    assert.equal( asset.getAvailable(), 400)
  })

  it('增加资产',function(){
    asset.increase(123.4)
    assert.equal( asset.getFrozen(), 0)
    assert.equal( asset.getBalance(), 523.4)
    assert.equal( asset.getAvailable(), 523.4)
  })
})
