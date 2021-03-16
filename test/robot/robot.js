var assert = require('assert')
var Robot = require('../../core/robot/robot')
var Exchange = require('../../core/exchange/exchangeP')
var events = require('../../core/common/events')

let robot = null
let exchangeName = 'testex'
describe('测试robot模块',function(){
  let ex
  it('创建robot，注册exchange，policy, prepare',function(){
    ex = new Exchange({
      name: 'test',
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
      r.ex.createKline(60)
      return 'pause'
    }

    robot.registerPrepare(prepare)
    robot.registerPolicy(policy)
  })


  it('getEx',function(){
    assert.deepEqual( robot.getEx('test'), ex)
  })

  //events.emit('rROBOT_TICKERS_test_btcusdt', [1, 1, 1, 1, 1, 1])
  it('执行run',async function(){
    let res = await robot.run()
    assert.equal( res, 'pause')
    events.emit(`ROBOT_TICKERS_${exchangeName}_btcusdt`, [1, 1, 1, 1, 1, 1])
    events.emit(`ROBOT_TICKERS_${exchangeName}_btcusdt`, [2, 2, 2, 2, 1, 1])
  })

  it('测试account事件',function(done){

    let test = false

    robot._policyCallback = false

    robot.registerPolicy(() => { 
      test = true
    })
   
    events.emit(`ROBOT_ACCOUNT_${exchangeName}_btcusdt`, 1)

    setTimeout(() => {
      assert.equal( test, true)
      done()
    } , 100)
  })

  it('测试position事件',function(done){

    let test = false

    robot._policyCallback = false
    robot.registerPolicy(() => { 
      test = true
    })
   
    events.emit(`ROBOT_POSITION_${exchangeName}_btcusdt`, {
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

    setTimeout(() => {
      assert.equal( test, true)
      done()
    } , 100)
    
  })



  it('测试kline事件',function(){

    const ks = [{
      id: 1,
      high: 100,
      low: 1,
      open: 50,
      close: 40,
      stime: 1,
      etime: 2,
      type: 60
    },{
      id: 2,
      high: 200,
      low: 15,
      open: 40,
      close: 70,
      stime: 2,
      etime: 3,
      type: 60

    },{
      id: 2,
      high: 300,
      low: 15,
      open: 70,
      close: 70,
      stime: 2,
      etime: 3,
      type: 60

    },{
      id: 3,
      high: 300,
      low: 15,
      open: 70,
      close: 70,
      stime: 2,
      etime: 3,
      type: 60

    }]

    let updateTime = 0,  createTime = 0

    robot._policyCallback = false
    robot.registerPolicy((V, e) => { 

      if(e.event == 'KLINE_UPDATE') updateTime++
      if(e.event == 'KLINE_CREATE') createTime++
    })
   
    events.emit(`ROBOT_KLINE_${exchangeName}_btcusdt`, ks[0])

    assert.equal( updateTime, 1)
    assert.equal( createTime, 1)


    events.emit(`ROBOT_KLINE_${exchangeName}_btcusdt`, ks[1])

    assert.equal( updateTime, 2)
    assert.equal( createTime, 2)


    events.emit(`ROBOT_KLINE_${exchangeName}_btcusdt`, ks[2])

    assert.equal( updateTime, 3)
    assert.equal( createTime, 2)


    events.emit(`ROBOT_KLINE_${exchangeName}_btcusdt`, ks[3])

    assert.equal( updateTime, 4)
    assert.equal( createTime, 3)


  
    
  })



  it('测试queue',function(){
    robot.createQueue('q1')

    assert.equal( robot.queues.length, 1)
    assert.equal( robot.getQueue('q1').id, 'q1')

    robot.createQueue('q2')
    assert.equal( robot.queues.length, 2)

    let res= robot.removeQueue('q1')
    assert.equal( res, true)
    assert.equal( robot.queues.length, 1)
    assert.equal( robot.getQueue('q1'), false)
  })

  it('测试group',function(){
    robot.createGroup('g1')

    assert.equal( robot.groups.length, 1)
    assert.equal( robot.getGroup('g1').id, 'g1')

    robot.createGroup('g2')
    assert.equal( robot.groups.length, 2)

    let res= robot.removeGroup('g1')
    assert.equal( res, true)
    assert.equal( robot.groups.length, 1)
    assert.equal( robot.getGroup('g1'), false)
  })

  it('测试ma',function(){
    robot.createMa('m1')

    assert.equal( robot.ma.length, 1)
    assert.equal( robot.getMa('m1').id, 'm1')

    robot.createMa('m2')
    assert.equal( robot.ma.length, 2)

    let res= robot.removeMa('m1')
    assert.equal( res, true)
    assert.equal( robot.ma.length, 1)
    assert.equal( robot.getMa('m1'), false)
  })

})
