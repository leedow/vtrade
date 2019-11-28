let assert = require('assert')
let clock = require('../../core/common/clock')
let Core = require('../../core/common/core')


describe('测试clock模块',function(){
  it('test模式',function(){
    clock.test = true
    clock.time = 1000
    assert.equal( clock.now(), 1000)
  })

  it('实盘模式',function(){
    clock.test = false
    assert.equal( clock.now(), Date.now())
  })

  it('测试不同类中clock时间表现是否一致',function(){
    let c1 = new Core()
    let c2 = new Core()
    clock.test = true
    clock.time = 999

    assert.equal( c1.clock.now(), c2.clock.now() )
  })

})
