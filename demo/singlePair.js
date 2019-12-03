var Robot = require('../core/robot/robot')
var Exchange = require('../core/exchange/exchange')
var events = require('../core/common/events')

const exchangeName = 'vtrade'
const pairName = 'btcusdt'

let ex = new Exchange({
  exchange: exchangeName,
  pair: pairName,
  from : 'usdt',
  to: 'btc',
  makerFee: -0.01,
  takerFee: 0.01,
  amountAcc: 2,
  priceAcc: 4
})

let robot = new Robot()
robot.registerExchange(ex)

robot.registerPrepare((V) => {

})

robot.registerPolicy((V) => {

})
