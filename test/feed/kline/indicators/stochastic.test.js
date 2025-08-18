const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('Stochastic Oscillator Indicator Tests', function() {
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
    const result = kline.stochastic()
    
    assert(result !== null, 'Stochastic should not return null with sufficient data')
    assert(typeof result === 'object', 'Stochastic should return an object')
    assert(typeof result.k === 'number', 'Stochastic should have k value as number')
    assert(typeof result.d === 'number', 'Stochastic should have d value as number')
  })
  
  it('should return values in correct range (0-100)', function() {
    const result = kline.stochastic()
    
    assert(result.k >= 0 && result.k <= 100, 'K value should be between 0 and 100')
    assert(result.d >= 0 && result.d <= 100, 'D value should be between 0 and 100')
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    for(let i = 1; i <= 5; i++) {
      shortKline.remember({ id: i, stime: i * 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    }
    
    const result = shortKline.stochastic()
    assert(result === null, 'Stochastic should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.stochastic(14, 3, 2)
    assert(result === null, 'Stochastic should return null for size > 1')
  })
  
  it('should work with different periods', function() {
    const result1 = kline.stochastic(14, 3)
    const result2 = kline.stochastic(9, 3)
    
    assert(result1 !== null, 'Stochastic should work with period 14')
    assert(result2 !== null, 'Stochastic should work with period 9')
  })
})