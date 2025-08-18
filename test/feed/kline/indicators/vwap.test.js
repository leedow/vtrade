const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('VWAP (Volume Weighted Average Price) Indicator Tests', function() {
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加测试数据
    for(let i = 1; i <= 25; i++) {
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
  
  it('should return a number', function() {
    const result = kline.vwap()
    
    assert(result !== null, 'VWAP should not return null with sufficient data')
    assert(typeof result === 'number', 'VWAP should return a number')
  })
  
  it('should return reasonable VWAP values', function() {
    const result = kline.vwap(20)
    
    // VWAP应该在合理的价格范围内
    assert(result > 100 && result < 200, 'VWAP should be within reasonable price range')
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    for(let i = 1; i <= 10; i++) {
      shortKline.remember({ id: i, stime: i * 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    }
    
    const result = shortKline.vwap(20)
    assert(result === null, 'VWAP should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.vwap(20, 2)
    assert(result === null, 'VWAP should return null for size > 1')
  })
  
  it('should work with different periods', function() {
    const result1 = kline.vwap(20)
    const result2 = kline.vwap(10)
    
    assert(result1 !== null, 'VWAP should work with period 20')
    assert(result2 !== null, 'VWAP should work with period 10')
  })
  
  it('should calculate VWAP correctly for simple case', function() {
    // 创建简单的测试用例来验证计算
    const simpleKline = new Kline('1m')
    const simpleData = [
      { open: 99, high: 102, low: 98, close: 100, vol: 1000 }, // 典型价格 = 100, 成交量 = 1000
      { open: 101, high: 104, low: 96, close: 102, vol: 2000 }  // 典型价格 = 100.67, 成交量 = 2000
    ]
    
    simpleData.forEach((data, index) => {
      simpleKline.remember({
        id: index + 1,
        stime: (index + 1) * 1000,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        vol: data.vol
      })
    })
    
    const result = simpleKline.vwap(2)
    
    // 手动计算VWAP
    // 第一个K线：典型价格 = (102 + 98 + 100) / 3 = 100
    // 第二个K线：典型价格 = (104 + 96 + 102) / 3 = 100.67
    // VWAP = (100 * 1000 + 100.67 * 2000) / (1000 + 2000) = 301340 / 3000 = 100.45
    const tp1 = (102 + 98 + 100) / 3
    const tp2 = (104 + 96 + 102) / 3
    const expectedVWAP = (tp1 * 1000 + tp2 * 2000) / (1000 + 2000)
    
    assert(Math.abs(result - expectedVWAP) < 0.01, `VWAP should be ${expectedVWAP}, but got ${result}`)
  })
})