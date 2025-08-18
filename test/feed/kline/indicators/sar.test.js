const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('SAR (Parabolic SAR) Indicator Tests', function() {
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加测试数据 - 模拟上升趋势
    const testData = [
      { open: 96, high: 100, low: 95, close: 98, vol: 1000 },
      { open: 98, high: 102, low: 97, close: 101, vol: 1100 },
      { open: 101, high: 105, low: 100, close: 104, vol: 1200 },
      { open: 104, high: 107, low: 102, close: 106, vol: 1300 },
      { open: 106, high: 110, low: 105, close: 109, vol: 1400 },
      { open: 109, high: 112, low: 107, close: 111, vol: 1500 },
      { open: 111, high: 115, low: 110, close: 114, vol: 1600 },
      { open: 114, high: 117, low: 112, close: 116, vol: 1700 },
      { open: 116, high: 120, low: 115, close: 119, vol: 1800 },
      { open: 119, high: 122, low: 117, close: 121, vol: 1900 },
      { open: 121, high: 125, low: 120, close: 124, vol: 2000 },
      { open: 124, high: 127, low: 122, close: 126, vol: 2100 },
      { open: 126, high: 130, low: 125, close: 129, vol: 2200 },
      { open: 129, high: 132, low: 127, close: 131, vol: 2300 },
      { open: 131, high: 135, low: 130, close: 134, vol: 2400 }
    ]
    
    testData.forEach((data, index) => {
      kline.remember({
        id: index + 1,
        stime: (index + 1) * 1000,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        vol: data.vol
      })
    })
  })
  
  it('should return correct object structure', function() {
    const result = kline.sar()
    
    assert(result !== null, 'SAR should not return null with sufficient data')
    assert(typeof result === 'object', 'SAR should return an object')
    assert(typeof result.sar === 'number', 'SAR should have sar property as number')
    assert(typeof result.trend === 'string', 'SAR should have trend property as string')
    assert(['up', 'down'].includes(result.trend), 'SAR trend should be up or down')
  })
  
  it('should return reasonable SAR values', function() {
    const result = kline.sar()
    
    assert(result.sar > 0, 'SAR value should be positive')
    assert(result.sar < 200, 'SAR value should be within reasonable range')
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    
    const result = shortKline.sar()
    assert(result === null, 'SAR should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.sar(0.02, 0.2, 2)
    assert(result === null, 'SAR should return null for size > 1')
  })
  
  it('should work with different acceleration factors', function() {
    const result1 = kline.sar(0.02, 0.2)
    const result2 = kline.sar(0.05, 0.3)
    
    assert(result1 !== null, 'SAR should work with default parameters')
    assert(result2 !== null, 'SAR should work with custom parameters')
    assert(result1.sar !== result2.sar, 'Different parameters should give different results')
  })
  
  it('should handle trending market data', function() {
    // 测试下降趋势数据
    const downTrendKline = new Kline('1m')
    const downTrendData = [
      { open: 136, high: 135, low: 130, close: 134, vol: 1000 },
      { open: 134, high: 132, low: 127, close: 131, vol: 1100 },
      { open: 131, high: 130, low: 125, close: 129, vol: 1200 },
      { open: 129, high: 127, low: 122, close: 126, vol: 1300 },
      { open: 126, high: 125, low: 120, close: 124, vol: 1400 },
      { open: 124, high: 122, low: 117, close: 121, vol: 1500 },
      { open: 121, high: 120, low: 115, close: 119, vol: 1600 },
      { open: 119, high: 117, low: 112, close: 116, vol: 1700 },
      { open: 116, high: 115, low: 110, close: 114, vol: 1800 },
      { open: 114, high: 112, low: 107, close: 111, vol: 1900 }
    ]
    
    downTrendData.forEach((data, index) => {
      downTrendKline.remember({
        id: index + 1,
        stime: (index + 1) * 1000,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        vol: data.vol
      })
    })
    
    const result = downTrendKline.sar()
    assert(result !== null, 'SAR should work with downtrend data')
    assert(['up', 'down'].includes(result.trend), 'SAR should indicate trend direction')
  })
})