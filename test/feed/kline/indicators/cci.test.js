var assert = require('assert')
var Kline = require('../../../../core/feed/kline')

describe('CCI指标测试', function(){
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
  
  it('CCI计算应该返回数字', function() {
    const result = kline.cci()
    
    assert.notEqual(result, null)
    assert.equal(typeof result, 'number')
  })
  
  it('CCI值应该在合理范围内', function() {
    const result = kline.cci()
    
    // CCI值通常在-200到+200之间，但可能超出
    assert.ok(result >= -500 && result <= 500)
  })
  
  it('数据不足时CCI应该返回null', function() {
    const shortKline = new Kline('1m')
    shortKline.remember({ id: 1, stime: 1000, open: 100, high: 105, low: 95, close: 102, vol: 1000 })
    
    const result = shortKline.cci(20)
    assert.equal(result, null)
  })
})