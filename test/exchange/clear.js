var assert = require('assert')
var Clear = require('../../core/exchange/clear')
var Order = require('../../core/order/order')

let clear = new Clear()

let orders = []
let prices = [100, 101, 102, 100, 102, 102, 104, 103]
let amounts = [1, 2, 1.5, 1, 0.5, 2, 0.5, 2.5]

for (var i = 0; i < 4; i++) {
  orders.push(new Order({
    side: 'buy',
    amountAcc: 2,
    priceAcc: 2,
    makerFee: -0.01,
    takerFee: 0.01,
    price: prices[i],
    amount: amounts[i]
  }))
  orders[orders.length-1].create()
}

for (var i = 0; i < 4; i++) {
  orders.push(new Order({
    side: 'sell',
    amountAcc: 2,
    priceAcc: 2,
    makerFee: -0.01,
    takerFee: 0.01,
    price: prices[i+4],
    amount: amounts[i+4]
  }))
  orders[orders.length-1].create()
}

describe('测试clear模块',function(){
  orders[0].isMaker = true
  orders[0].finish()
  orders[1].finish()

  it('获取待清算买单',function(){
    assert.deepEqual( clear._getBuyOrders(orders), [orders[0], orders[1]])
  })

  it('获取待清算卖单',function(){
    assert.deepEqual( clear._getSellOrders(orders), [])
  })

  it('获取待清算数量1',function(){
    assert.deepEqual( clear._getAmountClearing(
      clear._getBuyOrders(orders),
      clear._getSellOrders(orders)
    ), 0)
  })

  it('卖出102*0.5，获取待清算数量2',function(){
    orders[4].finish()
    assert.deepEqual( clear._getAmountClearing(
      clear._getBuyOrders(orders),
      clear._getSellOrders(orders)
    ), 0.5)
  })

  it('卖出102*2，获取待清算数量3',function(){
    orders[5].isMaker = true
    orders[5].finish()
    assert.deepEqual( clear._getAmountClearing(
      clear._getBuyOrders(orders),
      clear._getSellOrders(orders)
    ), 2.5)
    assert.deepEqual( clear._getBuyOrders(orders), [orders[0], orders[1]])
    assert.deepEqual( clear._getSellOrders(orders), [orders[4], orders[5]])
  })

  it('第一次清算',function(){
    let res = clear.clear(orders)
    assert.equal( orders[0].fee, 1*-0.01)
    assert.equal( orders[1].fee, 2*0.01)
    assert.equal( orders[4].fee, 102*0.5*0.01)
    assert.equal( orders[5].fee, 102*2*-0.01)

    assert.deepEqual( res.profit.toFixed(4), 102*2+102*0.5-100*1-101*1.5)
    assert.deepEqual( res.fee.toFixed(4), 100*1*-0.01 + (101*1.5*0.01) + (102*0.5*0.01) + (102 * 2 * -0.01))
    assert.deepEqual( res.feeMaker.toFixed(4), -3.04)
    assert.deepEqual( res.feeTaker.toFixed(4), (0.51+2.02*0.75).toFixed(4) )
    assert.deepEqual( res.buyFee.toFixed(4), (-1+2.02*0.75).toFixed(4) )
    assert.deepEqual( res.sellFee.toFixed(4), (0.51-2.04).toFixed(4) )
    assert.deepEqual( res.ordersBuy, 2 )
    assert.deepEqual( res.ordersSell, 2 )

  })


  it('第二次清算',function(){
    orders[7].finish()
    let res = clear.clear(orders)
    assert.equal( orders[7].fee, 103*2.5*0.01)
    assert.deepEqual( res.profit.toFixed(4), 103*0.5-101*0.5)
    assert.deepEqual( res.fee.toFixed(4), 103*0.5*0.01 + 101*0.5*0.01)
    assert.deepEqual( res.feeMaker.toFixed(4), 0)
    assert.deepEqual( res.feeTaker.toFixed(4), (103*0.5*0.01 + 101*0.5*0.01).toFixed(4) )
    assert.deepEqual( res.sellFee.toFixed(4), (103*0.5*0.01).toFixed(4) )
    assert.deepEqual( res.buyFee.toFixed(4), (101*0.5*0.01).toFixed(4) )
    assert.deepEqual( res.ordersBuy, 1 )
    assert.deepEqual( res.ordersSell, 1 )
  })

  it('清算记录',function(){
    assert.equal( clear.history.length, 2)
  })

  it('核对待清算订单',function(){
    assert.equal( clear.history.length, 2)
  })

  it('_getPriceAndAmountOfOrders',function(){
    assert.deepEqual(
      clear._getPriceAndAmountOfOrders([orders[0], orders[1]]),
      {
        price: 0,
        amount: 0,
        maxPrice: 101,
        minPrice: 100
      }
    )
  })

  it('getBothPositionInfo',function(){
    let o1 = new Order({
      side: 'buy',
      amountAcc: 2,
      priceAcc: 2,
      makerFee: -0.01,
      takerFee: 0.01,
      price: 100,
      //priceFill: 100,

      amount: 2
    })
    let o2 = new Order({
      side: 'sell',
      amountAcc: 2,
      priceAcc: 2,
      makerFee: -0.01,
      takerFee: 0.01,
      price: 101,
      //priceFill: 101,

      amount: 1
    })
    o1.create()
    o2.create()

    o1.finish(0.5)
    o2.finish()

    assert.deepEqual(
      clear.getBothPositionInfo([o1, o2]),
      {
        buy: {
          price: 100,
          amount: 0.5,
          maxPrice: 100,
          minPrice: 100
        },
        sell: {
          price: 101,
          amount: 1,
          maxPrice: 101,
          minPrice: 101
        }
      }
    )
  })

  it('getPositionInfo',function(){
    let o1 = new Order({
      side: 'buy',
      amountAcc: 2,
      priceAcc: 2,
      makerFee: -0.01,
      takerFee: 0.01,
      price: 100,
      //priceFill: 100,

      amount: 2
    })
    let o2 = new Order({
      side: 'sell',
      amountAcc: 2,
      priceAcc: 2,
      makerFee: -0.01,
      takerFee: 0.01,
      price: 101,
      //priceFill: 101,

      amount: 1
    })
    o1.create()
    o2.create()

    o1.finish(0.5)
    o2.finish()

    assert.deepEqual(
      clear.getPositionInfo([o1, o2]),
      {
        side: 'sell',
        price: 101,
        amount: 0.5
      }
    )

    assert.deepEqual(
      clear.getPositionInfo([]),
      {
        side: 'sell',
        price: 0,
        amount: 0
      }
    )

  })

})
