const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('DMI (Directional Movement Index) Indicator Tests', function() {
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加测试数据
    for(let i = 1; i <= 20; i++) {
      kline.remember({
        id: i,
        stime: i * 1000,
        open: 95 + i,
        high: 100 + i * 2,
        low: 90 + i,
        close: 98 + i,
        vol: 1000 + i * 100
      })
    }
  })
  
  it('should return correct object structure', function() {
    const result = kline.dmi()
    
    assert(result !== null, 'DMI should not return null with sufficient data')
    assert(typeof result === 'object', 'DMI should return an object')
    assert(typeof result.pdi === 'number', 'DMI should have pdi value as number')
    assert(typeof result.mdi === 'number', 'DMI should have mdi value as number')
    assert(typeof result.dx === 'number', 'DMI should have dx value as number')
  })
  
  it('should return reasonable DMI values', function() {
    const result = kline.dmi()
    
    assert(result.pdi >= 0 && result.pdi <= 100, 'PDI should be between 0 and 100')
    assert(result.mdi >= 0 && result.mdi <= 100, 'MDI should be between 0 and 100')
    assert(result.dx >= 0 && result.dx <= 100, 'DX should be between 0 and 100')
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    for(let i = 1; i <= 10; i++) {
      shortKline.remember({ id: i, stime: i * 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    }
    
    const result = shortKline.dmi()
    assert(result === null, 'DMI should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.dmi(14, 2)
    assert(result === null, 'DMI should return null for size > 1')
  })
  
  it('should work with different periods', function() {
    const result1 = kline.dmi(14)
    const result2 = kline.dmi(9)
    
    assert(result1 !== null, 'DMI should work with period 14')
    assert(result2 !== null, 'DMI should work with period 9')
  })
})