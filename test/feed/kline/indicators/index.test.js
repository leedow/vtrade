/**
 * 新增技术指标测试套件入口文件
 * 包含所有新增指标的测试：MACD、布林带、KDJ、威廉指标、CCI、ADX
 */

// 导入所有指标测试
require('./macd.test.js')
require('./bollinger.test.js')
require('./kdj.test.js')
require('./williams.test.js')
require('./cci.test.js')
require('./adx.test.js')
require('./sar.test.js')
require('./stochastic.test.js')
require('./trix.test.js')
require('./dmi.test.js')
require('./obv.test.js')
require('./vwap.test.js')

describe('新增技术指标测试套件', function() {
  it('所有测试文件应该正确加载', function() {
    // 这个测试确保所有测试文件都能正确加载
    var assert = require('assert')
    assert.equal(true, true)
  })
})