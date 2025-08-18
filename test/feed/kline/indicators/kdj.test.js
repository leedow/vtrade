var assert = require('assert')
var Kline = require('../../../../core/feed/kline')

describe('KDJ指标测试', function(){
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加测试数据
    for(let i = 1; i <= 25; i++) {
      kline.remember({
        id: i,
        stime: i * 1000,
        open: 100 + i,
        high: 105 + i,
        low: 95 + i,
        close: 102 + i,
        vol: 1000 + i * 100
      })
    }
  })
  
  it('KDJ计算应该返回正确的对象结构', function() {
    const result = kline.kdj()
    
    assert.notEqual(result, null)
    assert.ok(result.hasOwnProperty('k'))
    assert.ok(result.hasOwnProperty('d'))
    assert.ok(result.hasOwnProperty('j'))
    assert.equal(typeof result.k, 'number')
    assert.equal(typeof result.d, 'number')
    assert.equal(typeof result.j, 'number')
  })
  
  it('KDJ值应该在合理范围内', function() {
    const result = kline.kdj()
    
    assert.ok(result.k >= 0 && result.k <= 100)
    assert.ok(result.d >= 0 && result.d <= 100)
    // J值可能超出0-100范围
  })
  
  it('数据不足时KDJ应该返回null', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 100, high: 105, low: 95, close: 102, vol: 1000 })
    
    const result = shortKline.kdj(14)
    assert.equal(result, null)
  })
})