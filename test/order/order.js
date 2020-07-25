var assert = require('assert')
var Order = require('../../core/order/order')
var e = require('../../core/common/events')

let order1 = new Order()
let eventName = 'ORDER_TEST_btcusdt'
describe('测试order模块',function(){

  it('创建一个买单',function(){
    order1.id = 1
    order1.pair = 'btcusdt'
    order1.amountAcc = 4
    order1.priceAcc = 2
    order1.amount = 100.123456
    order1.price = 4321.123
    order1.makerFee = -0.001
    order1.takerFee = 0.001
    order1.side = 'buy'
    order1.exchange = 'TEST'

    assert.equal( order1.price, 4321.12)
    assert.equal( order1.amount, 100.1234)
  })

  it('模拟发送订单，接收OPEN事件',function(){
    e.on(eventName, (o) => {
      if(o.status == OPEN && o.id ==1) {
        assert.deepEqual( order1, o)
        assert.equal( o.status, OPEN)
      }
    })
    order1.create()
  })

  it('模拟取消订单，接收CANCEL事件',function(){
    e.on(eventName, (o) => {
      if(o.status == CANCELED && o.id ==1) {
        assert.deepEqual( order1, o)
        assert.equal( o.status, CANCELED)
      }
    })
    order1.cancel()
  })

  it('模拟发送买单，测试不成交',function(){
    order1.create()
    order1.checkStatusByPrice(2000, 5000)
    assert.deepEqual( order1.status, OPEN)
  })

  it('以maker形式成交',function(){
    e.on(eventName, (o) => {
      if(o.status == FILLED && o.id ==1) {
        assert.equal( o.status, FILLED)
        assert.equal( o.isMaker, true)
        assert.equal( o.fee, o.amount*-0.001)
      }
    })
    order1.checkStatusByPrice(4000, 4300)
    assert.equal( order1.amountUnfill, 0)
    assert.equal( order1.status, FILLED)
    assert.equal( order1.isMaker, true)
    assert.equal( order1.fee, order1.amount*-0.001)
  })


  let order_post = new Order()
  order_post.id = 1
  order_post.pair = 'btcusdt'
  order_post.amountAcc = 4
  order_post.priceAcc = 2
  order_post.amount = 100.123456
  order_post.price = 4321.123
  order_post.makerFee = -0.001
  order_post.takerFee = 0.001
  order_post.side = 'buy'
  order_post.exchange = 'TEST'
  order_post.postOnly = true

  it('测试postOnly下自动取消',function(){

    order_post.create()
    order_post.checkStatusByPrice(2000, 3000)
    assert.deepEqual( order_post.status, CANCELED)
    assert.deepEqual( order_post.cancelReason, 'postOnly')

  })



  let order2 = null

  it('用构造函数方法初始化',function(){
    order2 = new Order({
      id: 2,
      pair: 'btcusdt',
      amountAcc: 4,
      priceAcc: 2,
      amount: 100.123456,
      price: 4321.123,
      makerFee: -0.001,
      takerFee: 0.001,
      side: 'sell',
      exchange: 'TEST'
    })

    assert.equal( order2.price, 4321.12)
    assert.equal( order2.amount, 100.1234)
    // assert.deepEqual( order.status, 2)
  })


  it('以taker形式成交',function(){
    order2.create()

    e.on(eventName, (o) => {
      if(o.status == FILLED && o.id ==2) {
        assert.equal( o.status, 4)
        assert.equal( o.isMaker, false)
        assert.equal( o.fee, o.amount*0.001*o.price)
      }
    })

    order2.checkStatusByPrice(4321.123, 5000)
    assert.equal( order2.status, 4)
    assert.equal( order2.isMaker, false)
    assert.equal( order2.fee, order2.amount*0.001*order2.price)
    // assert.deepEqual( order.status, 2)
  })

  it('测试清算标记及待清算数量',function(){
    order2.amountClear = order2.amountFill
    assert.equal( order2.amountFill, order2.amount)
    assert.equal( order2.amountUnclear, 0)
    assert.equal( order2.cleared, true)
  })

  let order3 = new Order({
    id: 3,
    pair: 'btcusdt',
    amountAcc: 4,
    priceAcc: 2,
    amount: 100.123456,
    price: 4321.123,
    makerFee: -0.001,
    takerFee: 0.001,
    side: 'sell',
    exchange: 'TEST'
  })

  order3.create()

  // it('测试部分成交update',function(){
  //   order3.finish(2, 0.1)
  //   assert.equal( order3.amountFill, 2)
  //   assert.equal( order3.fee, 0.1)
  // })

  it('测试部分完成',function(){
    order3.finish(2, 0.1)
    assert.equal( order3.amountFill, 2)
    assert.equal( order3.fee, 0.1)
  })

  it('测试部分完成2',function(){
    order3.finish(3, 0.3)
    assert.equal( order3.amountFill, 2)
    assert.equal( order3.fee, 0.1)
  })

})
