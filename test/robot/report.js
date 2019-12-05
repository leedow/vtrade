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
})
