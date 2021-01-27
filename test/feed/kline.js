var assert = require('assert')
var Base = require('../../core/feed/kline')
var helper = require('../../core/tools/helper')

describe('测试feed/kline模块带ID情况',function(){
  let base = new Base()
  base.filterSame = false

  const ks = [{
    id: 1,
    high: 100,
    low: 1,
    open: 50,
    close: 40,
    stime: 1,
    etime: 2
  },{
    id: 2,
    high: 200,
    low: 15,
    open: 40,
    close: 70,
    stime: 2,
    etime: 3
  },{
    id: 2,
    high: 300,
    low: 15,
    open: 70,
    close: 70,
    stime: 2,
    etime: 3
  }]

  it('添加新数据',function(){
    base.remember(ks[0])
    assert.equal( base.data.length, 1)
    base.remember(ks[1])
    assert.equal( base.data.length, 2)
  })

  it('测试更新',function(){
    base.remember(ks[2])
    assert.equal( base.data.length, 2)
    assert.deepEqual( base.getLast(), ks[2])
  })

})


describe('测试feed/kline模块不带ID情况',function(){
  let base = new Base()
  base.filterSame = false

  const ks = [{
    high: 100,
    low: 1,
    open: 50,
    close: 40,
    stime: 1,
    etime: 2
  },{
    high: 200,
    low: 15,
    open: 40,
    close: 70,
    stime: 2,
    etime: 3
  },{
    high: 300,
    low: 15,
    open: 70,
    close: 70,
    stime: 2,
    etime: 3
  }]

  it('添加新数据',function(){
    base.remember(ks[0])
    assert.equal( base.data.length, 1)
    base.remember(ks[1])
    assert.equal( base.data.length, 2)
  })

  it('测试更新',function(){
    base.remember(ks[2])
    assert.equal( base.data.length, 2)
    assert.deepEqual( base.getLast(), ks[2])
  })

})
