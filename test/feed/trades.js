var assert = require('assert')
var Trades = require('../../core/feed/trades')
var helper = require('../../core/tools/helper')

let trades = new Trades()
let t = Date.now()
describe('测试trades模块',function(){
  it('添加新数据',function(){
    trades.remember([9000, 1, 'buy', t])
    assert.equal( trades.data.length, 1)
    trades.remember([9001, 2, 'sell', t+100])
    assert.equal( trades.data.length, 2)
  })

  it('获取订单参数',function(){
    let last = trades.getLast()
    let last2 = trades.getLast(2)
    assert.equal( last[TRADE_PRICE], 9001)
    assert.equal( last[TRADE_SIZE], 2)
    assert.equal( last[TRADE_SIDE], 'sell')

    assert.equal( last2[TRADE_PRICE], 9000)
    assert.equal( last2[TRADE_SIZE], 1)
    assert.equal( last2[TRADE_SIDE], 'buy')
  })
})
