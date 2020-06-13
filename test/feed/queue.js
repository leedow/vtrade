var assert = require('assert')
var Queue = require('../../core/feed/queue')
var helper = require('../../core/tools/helper')

let queue = new Queue()
queue.filterSame = false

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
    assert.equal( queue.getTrend(2).toFixed(10),  ((0.0014-0.00121)/0.00121).toFixed(10) )
  })

  it('getAvg',function(){
    assert.equal( queue.getAvg().toFixed(10),  (( 0.001+0.0012+0.0012+0.00121+0.0013+0.0014 )/6).toFixed(10) )
  })

  it('getAvg 2',function(){
    assert.equal( queue.getAvg(2).toFixed(10),  (( 0.0013+0.0014 )/2).toFixed(10) )
  })

  it('getMax',function(){
    assert.equal( queue.getMax(2), 0.0014 )
  })

  it('getMin',function(){
    assert.equal( queue.getMin(2),  0.001 )
  })

  it('getSum',function(){
    assert.equal( queue.getSum(),  0.001+0.0012+0.0012+0.00121+0.0013+0.0014 )
  })
})


let queue2 = new Queue()
queue2.filterSame = false

describe('测试queue模块，时间模式',function(){
  let t = Date.now()
  it('添加新数据',function(){
    queue2.remember(0.001, t)
    assert.equal( queue2.data.length, 1)
    queue2.remember(0.001, t+11000)
    assert.equal( queue2.data.length, 2)
    queue2.remember(0.002, t+12000)
    assert.equal( queue2.data.length, 3)
    queue2.remember(0.001, t+13000)
    assert.equal( queue2.data.length, 4)
    queue2.remember(0.002, t+14000)
    assert.equal( queue2.data.length, 5)
  })

  it('getPercentageByTime',function(){
    assert.equal( queue2.getPercentageByTime(10000, 0), 1)
  })

  it('getRetracementByTime',function(){
    assert.equal( queue2.getRetracementByTime(10000, 0), 0.5)
  })



})
