var assert = require('assert')
var Kline = require('../../../../core/feed/kline')

describe('布林带指标测试', function(){
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
  
  it('布林带计算应该返回正确的对象结构', function() {
    const result = kline.bollinger()
    
    assert.notEqual(result, null)
    assert.ok(result.hasOwnProperty('upper'))
    assert.ok(result.hasOwnProperty('middle'))
    assert.ok(result.hasOwnProperty('lower'))
    assert.equal(typeof result.upper, 'number')
    assert.equal(typeof result.middle, 'number')
    assert.equal(typeof result.lower, 'number')
  })
  
  it('布林带上轨应该大于中轨，中轨应该大于下轨', function() {
    const result = kline.bollinger()
    
    assert.ok(result.upper > result.middle)
    assert.ok(result.middle > result.lower)
  })
  
  it('数据不足时布林带应该返回null', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 100, high: 105, low: 95, close: 102, vol: 1000 })
    
    const result = shortKline.bollinger(20)
    assert.equal(result, null)
  })
})