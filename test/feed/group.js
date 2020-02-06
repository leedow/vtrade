var assert = require('assert')
var Group = require('../../core/feed/group')
var helper = require('../../core/tools/helper')

let group = new Group()
describe('测试group模块',function(){
  it('添加新数据',function(){
    group.remember(1, 10)
    assert.equal( group.data.length, 1)
    group.remember(2, 5)
    assert.equal( group.data.length, 2)
    group.remember(2, 8)
    assert.equal( group.data.length, 2)
  })

  it('getAvg',function(){
    assert.equal( group.getAvg().toFixed(5),  ((10+10+16)/23).toFixed(5) )
  })

  it('getMax',function(){
    assert.equal( group.getMax(), 2 )
  })

  it('getMin',function(){
    assert.equal( group.getMin(),  1 )
  })

  it('getTotalCount',function(){
    assert.equal( group.getTotalCount(),  23)
  })
})
