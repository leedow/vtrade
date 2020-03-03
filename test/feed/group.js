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

  it('添加count负数，value已存在',function(){
    group.remember(1, -1)
    assert.equal( group.data.length, 2)
  })

  it('添加count负数，value不存在',function(){
    group.remember(5, -1)
    assert.equal( group.data.length, 3)
  })

  it('getAvg',function(){
    assert.equal( group.getAvg().toFixed(5),  ((10+10+16-1-5)/21).toFixed(5) )
  })

  it('getAvg 加入临时变量',function(){
    assert.equal( group.getAvg([{value:20, count:-1}]).toFixed(5),  ((10+10+16-1-5-20)/(21-1)).toFixed(5) )
    assert.equal( group.getAvg([{value:20, count:2}]).toFixed(5),  ((10+10+16-1-5+40)/(21+2)).toFixed(5) )

  })

})
