var assert = require('assert')
var Robot = require('../../core/robot/robot')
var Exchange = require('../../core/exchange/exchange')
var events = require('../../core/common/events')

let robot = null
let exchangeName = Date.now()
describe('测试robot模块',function(){
  it('创建robot，注册exchange，policy, prepare',function(){
    let ex = new Exchange({
      exchange: exchangeName,
      pair: 'btcusdt',
      from : 'usdt',
      to: 'btc',
      makerFee: -0.01,
      takerFee: 0.01,
      amountAcc: 2,
      priceAcc: 4
    })

    robot = new Robot()
    robot.registerExchange(ex)
    assert.equal( robot.exchanges.length, 1)
    assert.deepEqual( robot.ex, ex)

    let n = 1

    let policy = (r) => {
      // console.log('111')
      assert.deepEqual(r, robot)

      if(n == 1) {
        assert.deepEqual(r.ex.tickers.getLast(1) , [1, 1, 1, 1, 1, 1])
      }

      if(n == 2) {
        assert.deepEqual(r.ex.tickers.getLast(1) , [2, 2, 2, 2, 1, 1])
      }

      n++

    }

    let prepare = (r) => {
      assert.deepEqual(r, robot)
    }

    robot.registerPrepare(prepare)
    robot.registerPolicy(policy)


  })

  //events.emit('rROBOT_TICKERS_test_btcusdt', [1, 1, 1, 1, 1, 1])
  it('执行run',function(){
    robot.run()
    events.emit(`ROBOT_TICKERS_${exchangeName}_btcusdt`, [1, 1, 1, 1, 1, 1])
    events.emit(`ROBOT_TICKERS_${exchangeName}_btcusdt`, [2, 2, 2, 2, 1, 1])
  })

})
