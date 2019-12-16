let Exchange = require('../exchange/exchange')
let Robot = require('../robot/robot')
let Order = require('../order/order')

module.exports = function(options) {
  let exchangeName = options.exchange
  let pairName = options.pair
  let eventName = `ROBOT_TICKERS_${exchangeName}_${pairName}`

  let ex = new Exchange({
    exchange: exchangeName,
    pair: pairName,
    from : options.from,
    to: options.to,
    makerFee: options.makerFee,
    takerFee: options.takerFee,
    amountAcc: options.amountAcc,
    priceAcc: options.priceAcc
  })

  ex.registerOrder(Order)
  ex.getAsset(options.from).balance = options.fromBalance
  ex.getAsset(options.to).balance = options.toBalance

  let robot = new Robot()

  robot.registerExchange(ex)

  return robot
}
