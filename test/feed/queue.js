var assert = require('assert')
var Queue = require('../../core/feed/queue')
var helper = require('../../core/tools/helper')

let queue = new Queue()
describe('测试queue模块',function(){
  it('添加新数据',function(){
    queue.remember(0.001)
    assert.equal( queue.data.length, 1)
    queue.remember(0.0012)
    assert.equal( queue.data.length, 2)
  })

  it('getTrend',function(){
    queue.remember(0.0012)
    queue.remember(0.00121)
    queue.remember(0.0013)
    queue.remember(0.0014)
    assert.equal( queue.getTrend(2),  (0.0014-0.00121)/0.00121 )
  })
})
