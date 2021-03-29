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

 
})
