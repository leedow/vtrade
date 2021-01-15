var assert = require('assert')
var Ex = require('../../core/exchange/ex')
let events = require('../../core/common/events')

const exchange = 'test'
const pair = 'btcusd_p'

let ex = new Ex({
  exchange: exchange,
  pair: pair
})

const event_name = (type) => {
  return `ROBOT_${type}_${exchange}_${pair}`
}

const TICKERS_EVENT = event_name('TICKERS')

//ex.exchange = 'test'
//ex.pair = 'btcusd_p'
describe('测试ex模块',function(){

  it('添加获取asset',function(){
    ex.createAsset('btc', 100)
    ex.createAsset('usdt', 200)
    assert.equal( ex.getAsset('btc').name, 'btc')
    assert.equal( ex.getAsset('usdt').name, 'usdt')
    assert.equal( ex.getAsset('btc').balance, 100)
    assert.equal( ex.getAsset('usdt').balance, 200)
  })

  it('添加获取订单',function(){
     ex.orders.push({
       orderNumber: '123'
     })
     assert.deepEqual( ex.getOrderByNumber('123'), {
       orderNumber: '123'
     })
     assert.equal( ex.getOrderByNumber('321'), null)
  })

  // it('测试tickers数据订阅',function(){
  //   events.emit(TICKERS_EVENT, [5000, 1, 4999, 2, 5001, 2])
  //   assert.deepEqual( ex.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2])
  //   events.emit(TICKERS_EVENT, [5001, 1, 4999.5, 2, 5001.2, 2])
  //   assert.deepEqual( ex.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2])
  //   assert.deepEqual( ex.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2])
  // })
  //
  // it('测试trades数据订阅',function(){
  //   events.emit('ROBOT_TRADES_test_btcusd_p', [5864,3000,"buy",1584020145972])
  //   assert.deepEqual( ex.trades.getLast(1), [5864,3000,"buy",1584020145972])
  // })

  // it('测试queue',function(){
  //   ex.createQueue('q1')
  //
  //   assert.equal( ex.queues.length, 1)
  //   assert.equal( ex.getQueue('q1').id, 'q1')
  //
  //   ex.createQueue('q2')
  //   assert.equal( ex.queues.length, 2)
  //
  //   let res= ex.removeQueue('q1')
  //   assert.equal( res, true)
  //   assert.equal( ex.queues.length, 1)
  //   assert.equal( ex.getQueue('q1'), false)
  // })
  //
  // it('测试group',function(){
  //   ex.createGroup('g1')
  //
  //   assert.equal( ex.groups.length, 1)
  //   assert.equal( ex.getGroup('g1').id, 'g1')
  //
  //   ex.createGroup('g2')
  //   assert.equal( ex.groups.length, 2)
  //
  //   let res= ex.removeGroup('g1')
  //   assert.equal( res, true)
  //   assert.equal( ex.groups.length, 1)
  //   assert.equal( ex.getGroup('g1'), false)
  // })

})
