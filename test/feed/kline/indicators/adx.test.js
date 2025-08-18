const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('ADX Indicator Tests', function() {
  let kline
  let testData

  beforeEach(function() {
    kline = new Kline({ktype: 60000})
    
    // 创建足够的测试数据（ADX需要更多数据点）
    testData = []
    for(let i = 0; i < 50; i++) {
      let basePrice = 100 + Math.sin(i * 0.1) * 10
      testData.push({
        high: basePrice + Math.random() * 2,
        low: basePrice - Math.random() * 2,
        open: basePrice + (Math.random() - 0.5),
        close: basePrice + (Math.random() - 0.5),
        vol: 1000 + Math.random() * 500,
        stime: Date.now() + i * 60000,
        etime: Date.now() + (i + 1) * 60000
      })
    }
    
    // 添加测试数据到kline
    testData.forEach((data, index) => {
      kline.remember(data, data.stime)
    })
  })

  it('should return correct object structure', function() {
    let result = kline.adx(14)
    
    assert(result !== null, 'ADX should not return null with sufficient data')
    assert(typeof result === 'object', 'ADX should return an object')
    assert(typeof result.adx === 'number', 'ADX value should be a number')
    assert(typeof result.diPlus === 'number', 'DI+ should be a number')
    assert(typeof result.diMinus === 'number', 'DI- should be a number')
  })

  it('should return reasonable ADX values', function() {
    let result = kline.adx(14)
    
    assert(result.adx >= 0, 'ADX should be non-negative')
    assert(result.adx <= 100, 'ADX should not exceed 100')
    assert(result.diPlus >= 0, 'DI+ should be non-negative')
    assert(result.diMinus >= 0, 'DI- should be non-negative')
  })

  it('should return null for insufficient data', function() {
    let shortKline = new Kline({ktype: 60000})
    
    // 添加少量数据
    for(let i = 0; i < 10; i++) {
      shortKline.remember({
        high: 105,
        low: 95,
        open: 100,
        close: 102,
        vol: 1000,
        stime: Date.now() + i * 60000,
        etime: Date.now() + (i + 1) * 60000
      }, Date.now() + i * 60000)
    }
    
    let result = shortKline.adx(14)
    assert.equal(result, null, 'ADX should return null with insufficient data')
  })

  it('should return null when size > 1', function() {
    let result = kline.adx(14, 2)
    assert.equal(result, null, 'ADX should return null when size > 1')
  })

  it('should handle different periods', function() {
    let result7 = kline.adx(7)
    let result21 = kline.adx(21)
    
    assert(result7 !== null, 'ADX with period 7 should not be null')
    assert(result21 !== null, 'ADX with period 21 should not be null')
    assert(typeof result7.adx === 'number', 'ADX 7 should return number')
    assert(typeof result21.adx === 'number', 'ADX 21 should return number')
  })

  it('should handle trending market data', function() {
    // 创建明显趋势的数据
    let trendingKline = new Kline({ktype: 60000})
    
    for(let i = 0; i < 30; i++) {
      let price = 100 + i * 2 // 明显上升趋势
      trendingKline.remember({
        high: price + 1,
        low: price - 1,
        open: price - 0.5,
        close: price + 0.5,
        vol: 1000,
        stime: Date.now() + i * 60000,
        etime: Date.now() + (i + 1) * 60000
      }, Date.now() + i * 60000)
    }
    
    let result = trendingKline.adx(14)
    assert(result !== null, 'ADX should work with trending data')
    assert(result.diPlus > result.diMinus, 'DI+ should be greater than DI- in uptrend')
  })
})