let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

describe('测试exchangeP模块独立方法',function(){
  ex = new Exchange({
    exchange: 'test',
    pair: 'btcusd_p',
    balance : 'btc',
    makerFee: -0.01,
    takerFee: 0.01,
    amountAcc: 2,
    priceAcc: 4,
    lever: LEVER
  })

  ex.getAsset('btc').balance = 100

  it('增加多仓',function(){
    ex.increasePosition('long', 100.123, 1.11, 1.321)
    assert.equal( ex.getAsset('long').balance, 1.11)
    assert.equal( ex.long.avgPrice, 100.123)
    assert.equal( ex.long.deposit, 1.321)
    assert.equal( ex.getAsset('btc').balance, 100)
    // assert.equal( ex.getAsset('btc').getFrozen(), ex.long.deposit)
  })

  it('继续增加多仓',function(){
    ex.increasePosition('long', 99.9, 2.11, 2.321)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, 1.321+2.321)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('平多部分',function(){
    ex.decreasePosition('long', 99.8, 1, 0)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11-1)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, (1.321+2.321)*(1.11+2.11-1)/(1.11+2.11) )
    assert.equal( ex.getAsset('btc').balance, 100 )
  })

  it('清空多仓',function(){
    ex.clearPosition('long', 0)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
  })

  it('开空1',function(){
    ex.increasePosition('short',100, 1, 1)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.short.avgPrice, 100)
    assert.equal( ex.short.deposit, 1)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('继续开空1',function(){
    ex.increasePosition('short',102, 1, 1)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 2)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('清空空仓',function(){
    ex.clearPosition('short', 0)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
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
    assert.equal( ex.getAsset('btc').balance, 100 -1)
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
    assert.equal( ex.getAsset('btc').balance, 100 -1+1)
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
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1  + 1/101-1/102  )
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
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  )
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
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102) )
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
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  + (1/PRICE -1/101) )
  })

  // 逻辑B
  it('开多2',function(){
    const PRICE = 100
    const PRE_BALANCE = ex.getAsset('btc').balance
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
    assert.equal( ex.getAsset('btc').balance, PRE_BALANCE+1/100-1/101)
  })


})



describe('测试exchangeP模块仿真',function(){
  const TAKER_FEE = 0.01
  const MAKER_FEE = -0.01

  return

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusd_p',
      balance : 'btc',
      makerFee: MAKER_FEE,
      takerFee: TAKER_FEE,
      amountAcc: 2,
      priceAcc: 4,
      lever: LEVER
    })

    assert.equal( exchange.getAsset('btc').name, 'btc')
    assert.equal( exchange.getAsset('long').name, 'long')
    assert.equal( exchange.getAsset('short').name, 'short')

    assert.equal( exchange.getAsset('btc').balance, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)

  })

  it('设置资产账户余额',function(){
    exchange.getAsset('btc').balance = 1
    assert.equal( exchange.getAsset('btc').balance, 1)
  })

  it('测试tickers数据订阅',function(){
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2])
    events.emit('ROBOT_TICKERS_test_btcusd_p', [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( exchange.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2])
  })

  it('4999买入1USD，成功下单，冻结1/4999btc',function(){
    exchange.registerOrder(Order)
    exchange.buy(4999, 1)
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 4999)
    assert.equal( exchange.getBottomSellOrder(), null)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('继续5001买入1usd多单，成功下单，冻结1/5001btc',function(){
    exchange.buy(5001, 1)
    assert.equal( exchange.getAsset('btc').getAvailable(10), (1-1/4999/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder(), null)
  })

  it('继续5001买入10000usd，资金不足，买入失败',function(){
    exchange.buy(5001, 10000)
    assert.equal( exchange.getAsset('btc').getAvailable(10), (1-1/4999/LEVER-1/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('4999卖出1usd，成功下单，冻结1/4999btc',function(){
    exchange.sell(4999, 1)
    assert.equal( exchange.getAsset('btc').getFrozen(10),  (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 3)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  it('5001卖出2usd，成功下单，冻结2/5001btc',function(){
    exchange.sell(5001, 2)
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER+2/5001/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 4)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  it('7000继续卖出10000usd',function(){ // 0.9995
    exchange.sell(7000, 10000)
    assert.equal( exchange.getAsset('btc').getFrozen(10), (1/4999/LEVER+1/5001/LEVER+1/4999/LEVER+2/5001/LEVER+10000/7000/LEVER).toFixed(10) )
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 5)
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

  it('测试获取极价订单',function(){
    assert.equal( exchange.getTopBuyOrder().price, 5001)
    assert.equal( exchange.getBottomSellOrder().price, 4999)
  })

  // 5001买 1  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4998-5001，taker成交5001买单',function() {
    const PRE_FROZEN = exchange.getAsset('btc').getFrozen()
    const PRE_BALANCE = exchange.getAsset('btc').getBalance()
    const PRICE = 5001
    const FEE = 1/PRICE*TAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4998, 2, 5001, 2])
    //events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 4)
    assert.equal( exchange.getOrdersByStatus(4).length, 1)

    assert.equal( exchange.long.avgPrice, 5001)
    assert.equal( exchange.long.deposit,  1/PRICE/LEVER )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 1)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('btc').getFrozen(10).toFixed(10), (PRE_FROZEN - 1/PRICE/LEVER).toFixed(10) )
    assert.equal( exchange.getAsset('btc').balance, PRE_BALANCE-1/PRICE/LEVER-FEE )
  })

  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 1 )
  })

  // 5001买 1 已成交  5001卖 2
  // 4999买 1  4999卖 1
  // 7000卖 10000
  it('价格波动至4999-5001，taker成交4999卖单',function() {
    const PRE_FROZEN = exchange.getAsset('btc').getFrozen()
    const PRE_BALANCE = exchange.getAsset('btc').getBalance()
    const PRICE = 4999
    const FEE = 1/PRICE*TAKER_FEE

    events.emit('ROBOT_TICKERS_test_btcusd_p', [5000, 1, 4999, 2, 5001, 2])
    assert.equal( exchange.getOrdersLength(), 5)
    assert.equal( exchange.getOrdersByStatus(2).length, 3)
    assert.equal( exchange.getOrdersByStatus(4).length, 2)

    assert.equal( exchange.long.avgPrice, 0)
    assert.equal( exchange.long.deposit,  0 )
    assert.equal( exchange.short.avgPrice, 0)
    assert.equal( exchange.short.deposit, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)
    assert.equal( exchange.getAsset('btc').getFrozen(10).toFixed(10), (PRE_FROZEN-1/PRICE/LEVER).toFixed(10) )
  //  assert.equal( exchange.getAsset('btc').balance, PRE_BALANCE-1/PRICE/LEVER-FEE )
  })

  it('测试多空仓位对消',function(){
  //  assert.equal( exchange.getPosition(), 0 )
  })

  //
  // it('测试获取极价订单',function(){
  //   assert.equal( exchange.getTopBuyOrder().price, 4999)
  //   assert.equal( exchange.getBottomSellOrder().price, 5001)
  // })
  //
  // // 5001卖 0.1
  // // 4999买 0.1
  // it('价格波动至5001-5002，maker成交5001卖单',function() {
  //   let usdt = exchange.getAsset('usdt').getBalance()
  //   let btc = exchange.getAsset('btc').getBalance()
  //
  //   events.emit('ROBOT_TICKERS_test_btcusdt', [5001, 1, 5001, 2, 5002, 2])
  //
  //   assert.equal( exchange.getAsset('btc').getFrozen(4), 0.1-0.1)
  //   assert.equal( exchange.getAsset('btc').getBalance(4), 1-0.1+0.1*0.99-0.1)
  //   assert.equal( exchange.getAsset('btc').getAvailable(4), 1-0.1+0.1*0.99-0.1)
  //   //
  //   assert.equal( exchange.getAsset('usdt').getFrozen(4), 499.9 )
  //   assert.equal( exchange.getAsset('usdt').getBalance(4), 10000-500.1+0.1*4999*0.99 + 0.1*5001*1.01)
  //   assert.equal( exchange.getAsset('usdt').getAvailable(4), 10000-500.1+0.1*4999*0.99-499.9+ 0.1*5001*1.01)
  //
  //   assert.equal( exchange.getOrdersLength(), 4)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  //   assert.equal( exchange.getOrdersByStatus(4).length, 3)
  // })
  //
  // it('测试仓位',function(){
  //   assert.equal( exchange.getPosition(), ( exchange.getAsset('btc').getBalance()*5001/(exchange.getAsset('btc').getBalance()*5001+exchange.getAsset('usdt').getBalance())  ).toFixed(4)   )
  // })
  //
  // it('测试获取极价订单',function(){
  //   assert.equal( exchange.getTopBuyOrder().price, 4999)
  //   assert.equal( exchange.getBottomSellOrder(), null)
  // })
  //
  //
  // // 4999买 0.1
  // it('价格波动至4999-5000，无订单成交',function() {
  //   events.emit('ROBOT_TICKERS_test_btcusdt', [5000, 1, 4999, 2, 5000, 2])
  //   assert.equal( exchange.getOrdersLength(), 4)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  //   assert.equal( exchange.getOrdersByStatus(4).length, 3)
  // })
  //
  // // 4999买 0.1
  // it('价格波动至4997-4998，maker成交4999买单',function() {
  //   events.emit('ROBOT_TICKERS_test_btcusdt', [5000, 1, 4997, 2, 4998, 2])
  //
  //   assert.equal( exchange.getAsset('btc').getFrozen(4), 0)
  //   assert.equal( exchange.getAsset('btc').getBalance(4), 1-0.1+0.1*0.99-0.1+0.1*1.01)
  //   assert.equal( exchange.getAsset('btc').getAvailable(4), 1-0.1+0.1*0.99-0.1+0.1*1.01)
  //
  //   assert.equal( exchange.getAsset('usdt').getFrozen(4), 499.9-499.9 )
  //   assert.equal( exchange.getAsset('usdt').getBalance(4), 10000-500.1+0.1*4999*0.99 + 0.1*5001*1.01-499.9)
  //   assert.equal( exchange.getAsset('usdt').getAvailable(4), 10000-500.1+0.1*4999*0.99-499.9+ 0.1*5001*1.01)
  //
  //   assert.equal( exchange.getOrdersLength(), 4)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 0)
  //   assert.equal( exchange.getOrdersByStatus(4).length, 4)
  // })
  //
  // it('测试获取极价订单',function(){
  //   assert.equal( exchange.getTopBuyOrder(), null)
  //   assert.equal( exchange.getBottomSellOrder(), null)
  // })
  //
  // it('6000卖出0.1BTC，成功下单，冻结0.1BTC',function(){
  //   exchange.sell(6000, 0.1)
  //   assert.equal( exchange.getAsset('btc').getFrozen(2), 0.1)
  //   assert.equal( exchange.getOrdersLength(), 5)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  // })
  //
  // it('3000买入0.1BTC，成功下单，冻结30USDT',function(){
  //   exchange.buy(3000, 0.01)
  //   assert.equal( exchange.getAsset('usdt').getFrozen(2), 30)
  //   assert.equal( exchange.getOrdersLength(), 6)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 2)
  // })
  //
  //
  //
  // it('取消买单',function(){
  //   events.emit('ROBOT_TICKERS_test_btcusdt', [4998, 1, 4994, 2, 4999, 2])
  //   exchange.getOrdersByStatus(2).forEach(order => {
  //     if(order.side == 'buy') {
  //       order.cancel()
  //     }
  //   })
  //   assert.equal( exchange.getAsset('usdt').getFrozen(2), 0)
  //   assert.equal( exchange.getOrdersLength(), 6)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  //   assert.equal( exchange.getOrdersByStatus(6).length, 1)
  // })
  //
  // it('取消卖单',function(){
  //   exchange.getOrdersByStatus(2).forEach(order => {
  //     if(order.side == 'sell') {
  //       order.cancel()
  //     }
  //   })
  //   assert.equal( exchange.getAsset('usdt').getFrozen(2), 0)
  //   assert.equal( exchange.getAsset('btc').getFrozen(2), 0)
  //   assert.equal( exchange.getOrdersLength(), 6)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 0)
  //   assert.equal( exchange.getOrdersByStatus(6).length, 2)
  // })
  //
  // it('核对报告',function(){
  //   let report = exchange.report()
  //   // console.log(report)
  //   assert.deepEqual( exchange.getPosition(8),  ( exchange.getAsset('btc').getBalance()*4998/(exchange.getAsset('btc').getBalance()*4998+exchange.getAsset('usdt').getBalance())  ).toFixed(8) )
  //   //assert.deepEqual(report.clear.profit, 4999*0.1*0.99 + 5001*0.1*1.01 - 4999*0.1*1.01 - 5001*0.1*0.99 )
  // })
  //
  // it('再次3000买入0.1BTC，成功下单，冻结30USDT',function(){
  //   exchange.buy(3000, 0.01)
  //   assert.equal( exchange.getAsset('usdt').getFrozen(2), 30)
  //   assert.equal( exchange.getOrdersLength(), 7)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  // })
  //
  // it('成交0.05BTC',function(){
  //   let order = exchange.getOrdersByStatus(2)[0]
  //   order.finish(0.004, 0.01)
  //   // console.log(exchange.getAsset('usdt').getFrozen(2))
  //   assert.equal( exchange.getAsset('usdt').getFrozen(2), 0)
  //   assert.equal( exchange.getOrdersLength(), 7)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 0)
  // })
  //
  // it('再次3000卖出0.1BTC，成功下单，冻结0.1BTC',function(){
  //   exchange.sell(3000, 0.1)
  //   assert.equal( exchange.getAsset('btc').getFrozen(2), 0.1)
  //   assert.equal( exchange.getOrdersLength(), 8)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 1)
  // })
  //
  // it('成交0.02BTC',function(){
  //   let order = exchange.getOrdersByStatus(2)[0]
  //   let pre1 = exchange.getAsset('usdt').getBalance()
  //   let pre2 = exchange.getAsset('btc').getBalance()
  //
  //   order.finish(0.02, 0.01)
  //   // console.log(exchange.getAsset('usdt').getFrozen(2))
  //   //console.log('feeeeeeeee')
  // //  console.log(order.fee)
  //   assert.equal( exchange.getAsset('usdt').getFrozen(10), 0)
  //   assert.equal( exchange.getAsset('usdt').getBalance(10), pre1 + 0.02*3000 - 3000*0.01/3000)
  //   assert.equal( exchange.getAsset('btc').getFrozen(10), 0)
  //   assert.equal( exchange.getAsset('btc').getBalance(10), pre2 - 0.02)
  //
  //   assert.equal( exchange.getOrdersLength(), 8)
  //   assert.equal( exchange.getOrdersByStatus(2).length, 0)
  // })
  //
  // it('自动清除清算完的订单',function(){
  //   exchange.removeOrders = true
  //   exchange.clearOrders()
  //   //assert.equal( exchange.getAsset('btc').getFrozen(2), 0.1)
  //   //assert.equal( exchange.getOrdersLength(), 8)
  //   assert.equal( exchange.getOrdersLength(), 1)
  // })

})
