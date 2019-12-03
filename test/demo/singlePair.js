var Robot = require('../../core/robot/robot')
var Exchange = require('../../core/exchange/exchange')
var events = require('../../core/common/events')
let Order = require('../../core/order/order')


const tickersData = require('./tickers')
var assert = require('assert')

const exchangeName = 'vtrade'
const pairName = 'btcusdt'
const eventName = `ROBOT_TICKERS_${exchangeName}_${pairName}`

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
ex.registerOrder(Order)
ex.getAsset('btc').balance = 0
ex.getAsset('usdt').balance = 100000

let robot = new Robot()

robot.registerExchange(ex)
robot.registerPrepare((V) => {})
robot.registerPolicy((V) => {
  let ticker = V.ex.tickers.getLast()

  if(ticker[6] == 1) {
    V.ex.buy(6705.8, 1)
  }

  if(ticker[6] == 2) {
    V.ex.buy(6705.7, 1)
  }

  if(ticker[6] == 5) {
    V.ex.sell(6705.6, 0.5 )
  }

  if(ticker[6] == 5) {
    V.ex.sell(6705.8, 0.5 )
  }
})
robot.run()
describe('全真模拟测试',function(){
  for (var i = 0; i < tickersData.length; i++) {
    ((i) => {
      it(`ticker${i}`,function(){
        // console.log(i)
        events.emit(eventName, tickersData[i])
        assert.deepEqual( robot.ex.tickers.getLast(), tickersData[i])

        if(i == 0) {
           assert.equal( robot.ex.getOrdersLength(), 1)
           assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 6705.8)
           assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 100000-6705.8)
           assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('btc').getAvailable(4), 0)
        }

        if(i == 1) {
           assert.equal( robot.ex.getOrdersLength(), 2)
           assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 6705.7)
           assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 100000-6705.8-6705.7)
           assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('btc').getAvailable(4), 1*0.99)
        }

        if(i == 3) {
           assert.equal( robot.ex.getOrdersLength(), 2)
           assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 100000-6705.8-6705.7)
           assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('btc').getAvailable(4), 1*0.99+1.01)
        }

        if(i == 5) {
           assert.equal( robot.ex.getOrdersLength(), 4)
           assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 100000-6705.8-6705.7+6705.6*0.5*0.99)
           assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0.5)
           assert.equal( robot.ex.getAsset('btc').getAvailable(4), 1*0.99+1.01-0.5-0.5)
        }

        if(i == 6) {
           assert.equal( robot.ex.getOrdersLength(), 4)
           assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 100000-6705.8-6705.7+6705.6*0.5*0.99+6705.8*0.5*1.01)
           assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0)
           assert.equal( robot.ex.getAsset('btc').getAvailable(4), 1*0.99+1.01-0.5-0.5)
        }

        // if(i == 6) { // 卖出
        //   assert.equal( robot.ex.getOrdersLength(), 2)
        //   assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 0)
        //   assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 10000-6705.8)
        //   assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0.99)
        //   assert.equal( robot.ex.getAsset('btc').getAvailable(4), 0)
        // }
        //
        // if(i == 7) { // 成功卖出
        //   assert.equal( robot.ex.getOrdersLength(), 2)
        //   assert.equal( robot.ex.getAsset('usdt').getFrozen(4), 0)
        //   assert.equal( robot.ex.getAsset('usdt').getAvailable(4), 10000-6705.8+6708*0.99*0.99)
        //   assert.equal( robot.ex.getAsset('btc').getFrozen(4), 0)
        //   assert.equal( robot.ex.getAsset('btc').getAvailable(4), 0)
        // }



      })
    })(i)

  }

})
