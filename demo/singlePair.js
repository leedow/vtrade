let ex = new Exchange({
  exchange: 'exchangeName',
  pair: 'pairName',
  from : 'usdt',
  to: 'btc',
  makerFee: -0.01,
  takerFee: 0.01,
  amountAcc: 2,
  priceAcc: 4
})

ex.registerOrder(Order) // 注册一个订单模型（现货、合约等）

let robot = new Robot()
robot.registerExchange(ex)

robot.registerPrepare((V) => {
  // 机器人初始化准备工作
})

robot.registerPolicy((V) => {
  // 策略执行
  V.ex.buy(...)
  V.ex.sell(...)
})

events.emit('事件名', '事件数据') // 发出一个事件

// 通过robot对象方法采集任何你想要的数据
...
