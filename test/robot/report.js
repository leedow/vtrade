var assert = require('assert')
var Report = require('../../core/robot/report')

let report = new Report()
describe('测试report模块',function(){
  it('record',function(){
    report.record(1, {
      a: 1,
      b: 2,
      c: 3
    })

    assert.deepEqual( report.result(), {
      x: [1],
      a: [1],
      b: [2],
      c: [3]
    })
  })

  it('restore',function(){
    const data = {
      x: [1,2],
      a: [1,3],
      b: [2,4],
      c: [3,6]
    }

    report.restore(data)
    assert.deepEqual( report.result(), data)
  })

  it('compressBy',function(){
    const data = {
      x: [1,2,6,10],
      a: [1,3,1,1],
      b: [2,4,2,2],
      c: [3,6,3,3]
    }

    report.restore(data)
    assert.deepEqual( report.compressBy((current, pre) => {
      return current.x - pre.x >= 1
    }), data)

    assert.deepEqual( report.compressBy((current, pre) => {
      return current.x - pre.x > 1
    }), {
      x: [1,6,10],
      a: [1,1,1],
      b: [2,2,2],
      c: [3,3,3]
    })

    assert.deepEqual( report.compressBy((current, pre) => {
      return current.x - pre.x > 5
    }), {
      x: [1,10],
      a: [1,1],
      b: [2,2],
      c: [3,3]
    })


  })
})
