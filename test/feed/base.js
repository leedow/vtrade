var assert = require('assert')
var Base = require('../../core/feed/base')
var helper = require('../../core/tools/helper')

let base = new Base()
describe('测试feed/base模块',function(){
  it('添加新数据',function(){
    base.remember(0.001)
    assert.equal( base.data.length, 1)
    base.remember(0.0012)
    assert.equal( base.data.length, 2)
  })

  it('getLast',function(){
    assert.equal( base.getLast(), 0.0012)
    assert.equal( base.getLast(2), 0.001)

  })

  it('测试去重',function(){
    base.remember(0.0012)
    assert.equal( base.data.length, 3)
    base.filterSame = true
    base.remember(0.0012)
    assert.equal( base.data.length, 3)
  })

  it('getFirst',function(){
    assert.equal( base.getFirst(), 0.001)
    assert.equal( base.getFirst(2), 0.0012)

  })


})
