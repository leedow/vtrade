var assert = require('assert')
var Order = require('../../core/order/order')
var e = require('../../core/common/events')

let order1 = new Order()

describe('测试order模块',function(){

  it('创建一个买单',function(){
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
    e.once('ORDER_CREATE_TEST', (o) => {
      assert.deepEqual( order1, o)
      assert.equal( o.status, 2)
    })
    order1.create()
  })

  it('模拟取消订单，接收CANCEL事件',function(){
    e.on('ORDER_CANCEL_TEST', (o) => {
      assert.deepEqual( order1, o)
      assert.equal( o.status, 6)
    })
    order1.create()
  })

  it('模拟发送买单，测试不成交',function(){
    order1.create()
    order1.checkStatusByPrice(2000, 5000)
    assert.deepEqual( order1.status, 2)
  })

  it('以maker形式成交',function(){
    e.once('ORDER_FILL_TEST', (o) => {
      assert.equal( o.status, 4)
      assert.equal( o.isMaker, true)
      assert.equal( o.fee, o.amount*-0.001)
    })
    order1.checkStatusByPrice(4000, 4300)

  })



  let order2 = null

  it('用构造函数方法初始化',function(){
    order2 = new Order({
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
    //assert.deepEqual( order.status, 2)
  })


  it('以taker形式成交',function(){
    order2.create()

    e.once('ORDER_FILL_TEST', (o) => {
      assert.equal( o.status, 4)
      assert.equal( o.isMaker, false)
      assert.equal( o.fee, o.amount*0.001*o.price)
    })
    order2.checkStatusByPrice(4321.123, 5000)
    //assert.deepEqual( order.status, 2)
  })


})
