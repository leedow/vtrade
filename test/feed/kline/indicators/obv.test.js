const assert = require('assert')
const Kline = require('../../../../core/feed/kline')

describe('OBV (On Balance Volume) Indicator Tests', function() {
  let kline
  
  beforeEach(function() {
    kline = new Kline('1m')
    
    // 添加测试数据 - 价格上涨和下跌交替
    const testData = [
      { open: 96, close: 98, vol: 1000 },
      { open: 98, close: 101, vol: 1100 }, // 上涨，OBV +1100
      { open: 101, close: 104, vol: 1200 }, // 上涨，OBV +1200
      { open: 104, close: 103, vol: 1300 }, // 下跌，OBV -1300
      { open: 103, close: 109, vol: 1400 }, // 上涨，OBV +1400
      { open: 109, close: 108, vol: 1500 }, // 下跌，OBV -1500
      { open: 108, close: 114, vol: 1600 }, // 上涨，OBV +1600
      { open: 114, close: 116, vol: 1700 }, // 上涨，OBV +1700
      { open: 116, close: 115, vol: 1800 }, // 下跌，OBV -1800
      { open: 115, close: 121, vol: 1900 }  // 上涨，OBV +1900
    ]
    
    testData.forEach((data, index) => {
      kline.remember({
        id: index + 1,
        stime: (index + 1) * 1000,
        open: data.open,
        high: data.close + 2,
        low: data.open - 2,
        close: data.close,
        vol: data.vol
      })
    })
  })
  
  it('should return a number', function() {
    const result = kline.obv()
    
    assert(result !== null, 'OBV should not return null with sufficient data')
    assert(typeof result === 'number', 'OBV should return a number')
  })
  
  it('should calculate OBV correctly', function() {
    const result = kline.obv()
    
    // 根据测试数据计算预期的OBV值
    // 98->101(+1100), 101->104(+1200), 104->103(-1300), 103->109(+1400), 
    // 109->108(-1500), 108->114(+1600), 114->116(+1700), 116->115(-1800), 115->121(+1900)
    // 预期OBV = 1100 + 1200 - 1300 + 1400 - 1500 + 1600 + 1700 - 1800 + 1900 = 3300
    const expectedOBV = 1100 + 1200 - 1300 + 1400 - 1500 + 1600 + 1700 - 1800 + 1900
    
    assert(result === expectedOBV, `OBV should be ${expectedOBV}, but got ${result}`)
  })
  
  it('should handle insufficient data', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 96, high: 100, low: 95, close: 98, vol: 1000 })
    
    const result = shortKline.obv()
    assert(result === null, 'OBV should return null with insufficient data')
  })
  
  it('should handle size > 1 (not supported)', function() {
    const result = kline.obv(2)
    assert(result === null, 'OBV should return null for size > 1')
  })
  
  it('should handle constant prices', function() {
    // 测试价格不变的情况
    const flatKline = new Kline('1m')
    for(let i = 1; i <= 5; i++) {
      flatKline.remember({ 
        id: i,
        stime: i * 1000,
        open: 100,
        high: 102, 
        low: 98, 
        close: 100, 
        vol: 1000 
      })
    }
    
    const result = flatKline.obv()
    assert(result === 0, 'OBV should be 0 when prices remain constant')
  })
})