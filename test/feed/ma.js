var assert = require('assert')
var Ma = require('../../core/feed/ma')
var helper = require('../../core/tools/helper')

let queue = [
  0.0012,
  0.00121,
  0.0013,
  0.0014
]

describe('测试ma模块',function(){
  let ma = new Ma()
  ma.step = 4

  it('添加新数据',function(){
    queue.forEach( (item, index) => {
      ma.remember(item)
      assert.equal( ma.data.length, index+1)
    })
  })

  it('getTrend 1',function(){
    let last = (0.0012+0.00121+0.0013+0.0014)/4
    let pre = (0.0012+0.00121)/2

    assert.equal( ma.self.getLast().toFixed(10),  last.toFixed(10) )
    assert.equal( ma.getTrend(2).toFixed(10),  (( last - pre)/pre).toFixed(10) )
  })

  it('getTrend 2',function(){
    let last = (0.0012+0.00121+0.0013+0.0014)/4
    let pre = (0.0012+0.00121+0.0013)/3

    assert.equal( ma.self.getLast().toFixed(10),  last.toFixed(10) )
    assert.equal( ma.getTrend(1).toFixed(10),  (( last - pre)/pre).toFixed(10) )
  })

})


describe('测试ma模块,时间模式',function(){
  let ma = new Ma()
  ma.step = 100
  ma.mode = 'timestep'

  it('添加新数据',function(){
    queue.forEach( (item, index) => {
      ma.remember(item, index*100+10)
      assert.equal( ma.data.length, index+1)
    })
  })

  it('getTrend 1',function(){
    let last = (0.0013+0.0014)/2
    let pre = (0.0012+0.00121)/2

    assert.equal( ma.self.getLast().toFixed(10),  last.toFixed(10) )
    assert.equal( ma.self.getLast(3).toFixed(10),  pre.toFixed(10) )
    assert.equal( ma.getTrend(2).toFixed(10),  (( last - pre)/pre).toFixed(10) )
  })

  it('getTrend 2',function(){
    let last = (0.0013+0.0014)/2
    let pre = (0.00121+0.0013)/2

    assert.equal( ma.self.getLast().toFixed(10),  last.toFixed(10) )
    assert.equal( ma.self.getLast(2).toFixed(10),  pre.toFixed(10) )
    assert.equal( ma.getTrend(1).toFixed(10),  (( last - pre)/pre).toFixed(10) )
  })

})

// describe('测试ma模块，时间模式',function(){
//   let t = Date.now()
//   it('添加新数据',function(){
//     ma2.remember(0.001, t)
//     assert.equal( ma2.data.length, 1)
//     ma2.remember(0.001, t+11000)
//     assert.equal( ma2.data.length, 2)
//     ma2.remember(0.002, t+12000)
//     assert.equal( ma2.data.length, 3)
//     ma2.remember(0.001, t+13000)
//     assert.equal( ma2.data.length, 4)
//     ma2.remember(0.002, t+14000)
//     assert.equal( ma2.data.length, 5)
//   })
//
//   it('getPercentageByTime',function(){
//     assert.equal( ma2.getPercentageByTime(10000, 0), 1)
//   })
//
//   it('getRetracementByTime',function(){
//     assert.equal( ma2.getRetracementByTime(10000, 0), 0.5)
//   })
//
//
//
// })
