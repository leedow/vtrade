var assert = require('assert')
var Base = require('../../core/feed/kline')
var helper = require('../../core/tools/helper')

describe('测试feed/kline模块带ID情况', function () {
  let base = new Base()
  base.ktype = 1/1000
  base.filterSame = false

  const ks = [{
    id: 1,
    high: 100,
    low: 1,
    open: 50,
    close: 40,
    stime: 1,
    etime: 2
  }, {
    id: 2,
    high: 200,
    low: 15,
    open: 40,
    close: 70,
    stime: 2,
    etime: 3
  }, {
    id: 2,
    high: 300,
    low: 15,
    open: 70,
    close: 70,
    stime: 2,
    etime: 3
  }]

  it('添加新数据', function () {
    let res1 = base.remember(ks[0])
    assert.equal(base.data.length, 1)
    assert.equal(res1.event, 'create')

    let res2 = base.remember(ks[1])
    assert.equal(base.data.length, 2)
    assert.equal(res2.event, 'create')
  })

  it('测试更新', function () {
    let res = base.remember(ks[2])
    assert.equal(base.data.length, 2)
    assert.equal(res.event, 'update')
    assert.deepEqual(base.getLast(), ks[2])
  })

  it('getKlineByTime 能根据etime精确查找', function () {

    let found = base.getKlineByTime(2, 'etime')
    assert.deepEqual(found, ks[0])
    let found2 = base.getKlineByTime(3, 'etime')
    assert.deepEqual(found2, ks[2])
    let found3 = base.getKlineByTime(2.3, 'etime')
    assert.deepEqual(found3, ks[0])
    let found4 = base.getKlineByTime(2.6, 'etime')
    assert.deepEqual(found4, ks[2])

    let found5 = base.getKlineByTime(26, 'etime')
    assert.equal(found5, null)
  })

})


describe('测试feed/kline模块不带ID情况', function () {
  let base = new Base()
  base.filterSame = false

  const ks = [{
    high: 100,
    low: 1,
    open: 50,
    close: 40,
    stime: 1,
    etime: 2
  }, {
    high: 200,
    low: 15,
    open: 40,
    close: 70,
    stime: 2,
    etime: 3
  }, {
    high: 300,
    low: 15,
    open: 70,
    close: 70,
    stime: 2,
    etime: 3
  }]

  it('添加新数据', function () {
    let res1 = base.remember(ks[0])
    assert.equal(base.data.length, 1)
    assert.equal(res1.event, 'create')

    let res2 = base.remember(ks[1])
    assert.equal(base.data.length, 2)
    assert.equal(res2.event, 'create')

  })

  it('测试更新', function () {
    let res = base.remember(ks[2])
    assert.equal(base.data.length, 2)
    assert.equal(res.event, 'update')
    assert.deepEqual(base.getLast(), ks[2])
  })

})
