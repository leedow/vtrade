var assert = require('assert')
var Order = require('../../core/order/order')

let order = new Order()

describe('测试order模块',function(){

  it('创建一个买单',function(){
    order.pair = 'btcusdt'
    order.amountAcc = 4
    order.priceAcc = 2
    order.amount = 100.123456
    order.price = 4321.123
    order.makerFee = -0.001
    order.takerFee = 0.001
    order.side = 'buy'

    assert.equal( order.price, 4321.12)
    assert.equal( order.amount, 100.1234)
  })

  it('模拟发送订单',function(){
    order.create()
    assert.equal( order.status, 2)
  })


})
