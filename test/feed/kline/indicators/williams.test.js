var assert = require('assert')
var Kline = require('../../../../core/feed/kline')

describe('威廉指标测试', function(){
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
  
  it('威廉指标计算应该返回数字', function() {
    const result = kline.williams()
    
    assert.notEqual(result, null)
    assert.equal(typeof result, 'number')
  })
  
  it('威廉指标值应该在-100到0之间', function() {
    const result = kline.williams()
    
    assert.ok(result >= -100 && result <= 0)
  })
  
  it('数据不足时威廉指标应该返回null', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 100, high: 105, low: 95, close: 102, vol: 1000 })
    
    const result = shortKline.williams(14)
    assert.equal(result, null)
  })
})