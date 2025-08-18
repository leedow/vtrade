const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('TRIX Indicator Tests', function() {
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加足够的测试数据用于TRIX计算
    for(let i = 1; i <= 50; i++) {
      kline.remember({
        id: i,
        stime: i * 1000,
        open: 95 + i,
        high: 100 + i,
        low: 90 + i,
        close: 98 + i,
        vol: 1000 + i * 100
      })
    }
  })
  
  it('should return a number', function() {
    const result = kline.trix()
    
    assert(result !== null, 'TRIX should not return null with sufficient data')
    assert(typeof result === 'number', 'TRIX should return a number')
  })
  
  it('should return reasonable TRIX values', function() {
    const result = kline.trix(14)
    
    // TRIX值通常在-10000到10000之间（基点表示）
    assert(result >= -10000 && result <= 10000, 'TRIX value should be within reasonable range')
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    for(let i = 1; i <= 10; i++) {
      shortKline.remember({ id: i, stime: i * 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    }
    
    const result = shortKline.trix(15) // 需要period + 2 = 17个数据点
    assert(result === null, 'TRIX should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.trix(14, 2)
    assert(result === null, 'TRIX should return null for size > 1')
  })
  
  it('should work with different periods', function() {
    const result1 = kline.trix(14)
    const result2 = kline.trix(9)
    
    assert(result1 !== null, 'TRIX should work with period 14')
    assert(result2 !== null, 'TRIX should work with period 9')
  })
})