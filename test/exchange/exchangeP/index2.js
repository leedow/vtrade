let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

describe('测试exchangeP模块独立方法，usd本位',function(){
  let ex = new Exchange({
    exchange: 'test',
    pair: 'btcusd_p',
    balance : 'usd',
    makerFee: -0.01,
    takerFee: 0.01,
    amountAcc: 2,
    priceAcc: 4,
    lever: LEVER,
    marginType: 'usd'
  })

  ex.getAsset('usd').balance = 1000

  it('增加多仓',function(){
    ex.increasePosition('long', 100.123, 1.11, 1.321)
    assert.equal( ex.getAsset('long').balance, 1.11)
    assert.equal( ex.long.avgPrice, 100.123)
    assert.equal( ex.long.deposit, 1.321)
    assert.equal( ex.getAsset('usd').balance, 1000)
    // assert.equal( ex.getAsset('btc').getFrozen(), ex.long.deposit)
  })

  it('继续增加多仓',function(){
    ex.increasePosition('long', 99.9, 2.11, 2.321)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, 1.321+2.321)
    assert.equal( ex.getAsset('usd').balance, 1000)
  })

  it('平多部分',function(){
    ex.decreasePosition('long', 99.8, 1, 0)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11-1)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, (1.321+2.321)*(1.11+2.11-1)/(1.11+2.11) )
    assert.equal( ex.getAsset('usd').balance, 1000 )
  })


  it('清空多仓',function(){
    ex.clearPosition('long', 0)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0)
    assert.equal( ex.getAsset('usd').balance, 1000  )
  })



  it('开空1',function(){
    ex.increasePosition('short',100, 1, 1)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.short.avgPrice, 100)
    assert.equal( ex.short.deposit, 1)
    assert.equal( ex.getAsset('usd').balance, 1000)
  })



  it('继续开空1',function(){
    ex.increasePosition('short',102, 1, 1)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 2)
    assert.equal( ex.getAsset('usd').balance, 1000)
  })



  it('清空空仓',function(){
    ex.clearPosition('short', 0)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('usd').balance, 1000  )
  })


  // 测试 updateAssets 逻辑C
  it('订单开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'long',
      deposit: 1/100/LEVER,
      fee: 1
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit, 1/100/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('usd').balance, 1000 -1)
  })


  // 逻辑C
  it('订单再次开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'long',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, 1/100/LEVER+1/102/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 2)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('usd').balance, 1000 -1+1)
  })


  // 逻辑E
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, ( 1/100/LEVER+1/102/LEVER )*0.5  )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('usd').balance, 1000 -1+1+1  + 1  )
  })

  // 逻辑D
  it('开空2',function(){
    ex.updateAssets({
      amountFill: 2,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 102)
    assert.equal( ex.short.deposit, 1/102/LEVER/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('usd').balance, 1000 -1+1+1+1+ 1 + 1  )
  })

  // 逻辑F
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'short',
      deposit: 1/100/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 1/102/LEVER/2 + 1/100/LEVER)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.getAsset('usd').balance, 1000 -1+1+1+1+ 2 )
  })



  // 逻辑B
  it('开多1',function(){
    const PRICE = 103
    ex.updateAssets({
      amountFill: 1,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 1/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, (1/102/LEVER/2 + 1/100/LEVER)/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('usd').balance, 1000 -1+1+1+1+ 2  -2 )
  })

  // 逻辑B
  it('开多2',function(){
    const PRICE = 100
    const PRE_BALANCE = ex.getAsset('usd').balance
    ex.updateAssets({
      amountFill: 2,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 2/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit,  1/PRICE/LEVER )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('usd').balance, PRE_BALANCE+101-100)
  })


})



describe('测试exchangeP模块仿真，usd本位，单向开仓,双向持仓',function(){
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

  it('测试tickers数据订阅',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2])
  })


  it('4999买入1USD，成功下单，冻结4999usd',function(){
    exchange.registerOrder(Order)
    let res = exchange.openLong(4999, 1, {
      params: {test:1}
    })
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
    exchange.openLong(5001, 1)
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
    exchange.openLong(5001, 20000)
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
    exchange.openShort(4999, 1)
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
    exchange.openShort(5001, 1)
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

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4998, 2, 5001, 2])
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

  it('测试实时杠杆',function(){
    assert.equal( exchange.getPositionLever(), 1/(exchange.getBalance()/5000))
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
    const FEE = -PRICE*MAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
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
    exchange.closeLong(5002, 0.5)
    assert.equal( exchange.getAsset('usd').getFrozen(10), (4999/LEVER+5001/LEVER+4999/LEVER+0.5*5002/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 4)
    //assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })


  it('价格波动至5002-5003，taker成交5002空单0.5',function() {
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    assert.equal( exchange.getOrdersByStatus(4).length, 3)

    assert.equal( exchange.long.avgPrice.toFixed(5), (5001).toFixed(5))
    assert.equal( exchange.long.deposit,  0.5*5001/LEVER )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 0.5)
    assert.equal( exchange.getAsset('short').balance, 1)
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE - 5002*0.5*TAKER_FEE + 0.5*(5002-5001) )

  })


  it('5002平多1.5，下单失败',function(){
    exchange.closeLong(5002, 1.5)
    assert.equal( exchange.long.avgPrice.toFixed(5), (5001).toFixed(5))
    assert.equal( exchange.long.deposit,  0.5*5001/LEVER )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 0.5)
    assert.equal( exchange.getAsset('short').balance, 1)
  })

  it('5002平多0.5',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()

    exchange.closeLong(5002, 0.5)
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 1)
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE - 5002*0.5*TAKER_FEE+0.5*(5002-5001) )
  })



  it('5002平空0.5',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    exchange.closeShort(5002, 0.5)
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5001, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5001, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5000, 2, 5002, 2])

    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 0.5*4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0.5)
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE - 5002*0.5*MAKER_FEE-0.5*(5002-4999) )
  })


  it('5002平空1.5，下单失败',function(){
    exchange.closeLong(5002, 1.5)
    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 4999)
    assert.equal( exchange.short.deposit, 0.5*4999/LEVER)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0.5)
  })

  it('5002平空0.5',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    exchange.closeShort(5002, 0.5)
    exchange.closeShort(5002, 0.5)

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5001, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5001, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5000, 2, 5002, 2])

    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('usd').balance, PRE_BALANCE - 5002*0.5*MAKER_FEE-0.5*(5002-4999) )
  })

  it('测试postOnly long订单成交',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    let order = exchange.openLong(5002, 0.5, {
      postOnly: true
    }).order

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5000, 2, 5002, 2])
    assert.equal( exchange.getAsset('long').balance, 0.5)
    assert.equal( order.status, FILLED)
    assert.equal( order.amountFill, 0.5)

  })

  it('测试postOnly long订单不成交',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    let order = exchange.openLong(5002, 0.5, {
      postOnly: true
    }).order

    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5000, 2, 5002, 2])
    assert.equal( exchange.getAsset('long').balance, 0.5)
    assert.equal( order.status, CANCELED)
    assert.equal( order.amountFill, 0)
  })


  it('测试postOnly short订单成交',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    let order = exchange.openShort(5003, 0.5, {
      postOnly: true
    }).order

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5003, 2, 5004, 2])

    assert.equal( exchange.getAsset('short').balance, 0.5)
    assert.equal( order.status, FILLED)
    assert.equal( order.amountFill, 0.5)

  })

  it('测试postOnly short订单不成交',function(){
    const PRE_BALANCE = exchange.getAsset('usd').getBalance()
    let order = exchange.openShort(5003, 0.5, {
      postOnly: true
    }).order

    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5002, 2, 5003, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 5003, 2, 5004, 2])

    assert.equal( exchange.getAsset('short').balance, 0.5)
    assert.equal( order.status, CANCELED)
    assert.equal( order.amountFill, 0)

  })




})
