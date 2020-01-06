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

  it('冻结资产后解冻资产',function(){
    asset.frozen(100)
    assert.equal( asset.getFrozen(), 100)
    asset.free(50)
    assert.equal( asset.getFrozen(), 50)
    asset.free(150)
    assert.equal( asset.getFrozen(), 0)
  })

  it('查询是否有资金可下单',function(){
    assert.equal( asset.test(100), true)
    assert.equal( asset.test(1000), false)
    asset.frozen(500)
    assert.equal( asset.test(100), false)
  })

  it('测试getAvailableByNumber',function(){
    assert.equal( asset.getAvailableByNumber(1000).toFixed(1), 23.4)
    assert.equal( asset.getAvailableByNumber(100).toFixed(1), 23.4)
    asset.free(1000)
    assert.equal( asset.getAvailableByNumber(100).toFixed(1), 100)


  })

})
