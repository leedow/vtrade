var assert = require('assert')
var Core = require('../../core/common/core')

let c = new Core()
describe('测试core模块',function(){

  it('getValue',function(){
    assert.equal( c._getValue(undefined, 'key'), null)
    assert.equal( c._getValue({test:1}, 'key'), null)
    assert.equal( c._getValue({test:1}, 'key', 10), 10)
    assert.equal( c._getValue({test:1}, 'test'), 1)
  })


})
