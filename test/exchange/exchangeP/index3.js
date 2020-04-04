let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

/**
 * 测试ws事件驱动
 */
describe('测试exchangeP模块仿真，在ws事件驱动下',function(){
  const TAKER_FEE = 0.01
  const MAKER_FEE = -0.01

  let exchange = null

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusd_p',
      balance : 'usd',
      makerFee: MAKER_FEE,
      takerFee: TAKER_FEE,
      amountAcc: 2,
      priceAcc: 4,
      lever: LEVER,
      marginType: 'usd'
    })

    assert.equal( exchange.getAsset('usd').name, 'usd')
    assert.equal( exchange.getAsset('long').name, 'long')
    assert.equal( exchange.getAsset('short').name, 'short')

    assert.equal( exchange.getAsset('usd').balance, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)

  })

  it('设置资产账户余额',function(){
    exchange.getAsset('usd').balance = 10000
    assert.equal( exchange.getAsset('usd').balance, 10000)
  })


  it('4999买入1USD，成功下单，冻结4999usd',function(){
    exchange.registerOrder(Order)
    let res = exchange.openLong(4999, 1, {
      params: {test:1}
    })
    res.order.orderNumber = 'openlong4999'
    //console.log(res)
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    //console.log(exchange.orders[exchange.orders.length-1].params)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].params, {test:1})
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 4999)
    assert.equal( exchange.getBottomSellOrder(), null)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('继续5001买入1usd多单，成功下单，冻结1/5001btc',function(){
    let res = exchange.openLong(5001, 1)
    res.order.orderNumber = 'openlong5001'
    assert.equal( exchange.getAsset('usd').getAvailable(10), (10000-4999/LEVER-5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder(), null)
  })

  it('继续5001买入20000usd，资金不足，买入失败',function(){
    let res = exchange.openLong(5001, 20000)
    res.order.orderNumber = 'openlong5001-2'
    assert.equal( exchange.getAsset('usd').getAvailable(10), (10000-4999/LEVER-5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 0)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('4999平仓1btc，成功下单，冻结4999usd',function(){

    let res = exchange.openShort(4999, 1)
    res.order.orderNumber = 'openshort4999'

    assert.equal( exchange.getAsset('usd').getFrozen(10),  (4999/LEVER+5001/LEVER+4999/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 1)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })


  it('5001开空1btc，下单失败',function(){
    let res = exchange.openShort(5001, 1)
    res.order.orderNumber = 'openshort5001'

    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER+4999/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 1)
    assert.equal( exchange.getBuyAmountByStatus(2), 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  // 5001买 1  5001卖 1
  // 4999买 1
  // 7000卖 10000
  it('价格波动至4998-5001，taker成交5001买单',function() {
    const PRE_FROZEN = exchange.getAsset('usd').getFrozen()
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    const PRICE = 5001
    const FEE = PRICE*TAKER_FEE

    events.emit('ROBOT_ORDERS_test_btcusd_p', [{
      orderNumber: 'openlong5001',
      status: FILLED,
      price: 5001,
      priceFill: 5001,
      fee: FEE
    }])
    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
    assert.equal( exchange.getOrdersByStatus(4).length, 1)

    assert.equal( exchange.long.avgPrice, 5001)
    assert.equal( exchange.long.deposit,  PRICE/LEVER )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)

    return
    assert.equal( exchange.getAsset('long').balance, 1)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('usd').getFrozen(10).toFixed(10), (PRE_FROZEN).toFixed(10) )
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE-FEE )
  })


  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  it('测试获取下单数量',function(){
    assert.equal( exchange.getSellAmountByStatus(2), 1)
    assert.equal( exchange.getBuyAmountByStatus(2), 1)
  })

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4999-5001，maker成交4999卖单',function() {
    const PRE_FROZEN = exchange.getAsset('usd').getFrozen()
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    const PRICE = 4999
    const FEE = PRICE*MAKER_FEE

    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    events.emit('ROBOT_ORDERS_test_btcusd_p', [{
      orderNumber: 'openshort4999',
      status: FILLED,
      price: 4999,
      priceFill: 4999,
      fee: FEE
    }])


    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    assert.equal( exchange.getOrdersByStatus(4).length, 2)

    assert.equal( exchange.long.avgPrice, 5001)
    assert.equal( exchange.long.deposit,  5001/LEVER )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 1)
    assert.equal( exchange.getAsset('short').balance, 1)
    //assert.equal( exchange.getAsset('btc').getFrozen(10).toFixed(10), (PRE_FROZEN-1/PRICE/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE+FEE )
  })


  it('5002平多0.5',function(){
    let res = exchange.closeLong(5002, 0.5)
    res.order.orderNumber = 'closelong5002'
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER+4999/LEVER+0.5*5002/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 4)

    //assert.equal( exchange.getOrdersByStatus(2).length, 3)
    events.emit('ROBOT_ORDERS_test_btcusd_p', [{
      orderNumber: 'closelong5002',
      status: CANCELED,
      price: 4999,
      priceFill: 4999,
      fee: 0,
      amountFill: 0
    }])

    assert.equal( res.order.status, CANCELED)
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER+4999/LEVER).toFixed(10) )

  })


  it('测试account变更事件',function(){
    events.emit('ROBOT_ACCOUNT_test_btcusd_p', {
      balance: 1000,
      margin: 100
    })
    assert.equal( exchange.getAsset('usd').balance, 1000)
    assert.equal( exchange.getAsset('usd').getFrozen(), 100)


  })

  it('测试position变更事件',function(){
    events.emit('ROBOT_POSITION_test_btcusd_p', {
      long: {
        amount: 10,
        avgPrice: 100,
        margin: 10
      },
      short: {
        amount: 20,
        avgPrice: 200,
        margin: 20
      }
    })

    assert.equal( exchange.getAsset('long').balance, 10)
    assert.equal( exchange.getAsset('short').balance, 20)

    assert.equal( exchange.long.avgPrice, 100)
    assert.equal( exchange.long.deposit, 10)

    assert.equal( exchange.short.avgPrice, 200)
    assert.equal( exchange.short.deposit, 20)





  })






})
