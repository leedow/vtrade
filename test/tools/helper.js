var assert = require('assert')
var helper = require('../../core/tools/helper')

const datas = [1, 5,  2,  6,  3,  6, 6]
describe('测试helper模块',function(){
  it('sub',function(){
    assert.deepEqual( helper.sub(datas), [1, 4, -3, 4, -3, 3, 0])
  })

  it('riseFall',function(){
    assert.deepEqual( helper.riseFall(datas), {
      rise: 3,
      fall: 2, 
      same: 1
    })
  })

  it('breakHigh',function(){
    let res = helper.breakHigh(datas)
    assert.deepEqual( res.count, 2)
    assert.deepEqual( res.percent.toFixed(5), (2/7).toFixed(5))

  })

  it('avg',function(){
    assert.equal( helper.avg(datas).toFixed(6), ((1+5+ 2+ 6+3+6+6)/7).toFixed(6)  )
  })

  it('max',function(){
    assert.deepEqual( helper.max(datas), [6, 3] )
  })

  it('min',function(){
    assert.deepEqual( helper.min(datas), [1, 0] )
  })
 
})
