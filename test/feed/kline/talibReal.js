var assert = require('assert')
var Kline = require('../../../core/feed/kline')
var Tickers = require('../../../core/feed/tickers')
var helper = require('../../../core/tools/helper')
let talib = require('talib')

describe('测试feed/kline模块指标计算，核对和talib直接计算结果',function(){
  let kline = new Kline()
  
  kline.filterSame = false
  kline.memoryTimeLimit = 99999999999999999
  kline.ktype = 60

  let st = Date.now()


  const ks = [{
    id: st,
    high: 100,
    low: 1,
    open: 50,
    close: 40,
    stime: st,
    etime: st + 59999
  },{
    id: st + 60000,
    high: 200,
    low: 15,
    open: 40,
    close: 70,
    stime: st + 60000,
    etime: st + 60000 + 59999
  },{
    id: st + 2*60000,
    high: 300,
    low: 15,
    open: 70,
    close: 70,
    stime: st + 2*60000,
    etime: st + 2*60000 + 59999
  },{
    id: st + 3*60000,
    high: 320,
    low: 11,
    open: 72,
    close: 77,
    stime: st + 3*60000,
    etime: st + 3*60000 + 59994
  }]

  const ks2 = [ks[0], ks[1], ks[2]]

  ks.forEach(k => {
    kline.remember(k)
  })

  it('MA',function(){
    let real1 = talib.execute({
        name: 'MA',
        startIdx: ks.length-1,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks.map(item => item.close)
    })

    let real2 = kline.MA(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })

  it('ma',function(){
    let real1 = talib.execute({
        name: 'MA',
        startIdx: ks.length-1,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks.map(item => item.close)
    })

    let real2 = kline.ma(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })

 
  it('EMA',function(){
    let real1 = talib.execute({
        name: 'EMA',
        startIdx: ks.length-1,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks.map(item => item.close)
    })

    let real2 = kline.EMA(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })



  it('RSI',function(){
    let real1 = talib.execute({
        name: 'RSI',
        startIdx: ks.length-1,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks.map(item => item.close)
    })

    let real2 = kline.RSI(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })

  it('ATR',function(){
    let real1 = talib.execute({
        name: 'ATR',
        startIdx: ks.length-1,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks.map(item => item.close),
        high: ks.map(item => item.high),
        low: ks.map(item => item.low),
        open: ks.map(item => item.open),
        close: ks.map(item => item.close)
    })

    let real2 = kline.ATR(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })


  it('EMA with ignoreIncomplete',function(){
    let real1 = talib.execute({
        name: 'EMA',
        startIdx: ks2.length-1,
        endIdx: ks2.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks2.map(item => item.close)
    })
    kline.ignoreIncomplete = true
    let real2 = kline.EMA(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })

  it('RSI with ignoreIncomplete',function(){
    let real1 = talib.execute({
        name: 'RSI',
        startIdx: ks2.length-1,
        endIdx: ks2.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks2.map(item => item.close)
    })
    kline.ignoreIncomplete = true
    let real2 = kline.RSI(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })

  it('ATR with ignoreIncomplete',function(){
    let real1 = talib.execute({
        name: 'RSI',
        startIdx: ks2.length-1,
        endIdx: ks2.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks2.map(item => item.close),
        high: ks2.map(item => item.high),
        low: ks2.map(item => item.low),
        open: ks2.map(item => item.open),
        close: ks2.map(item => item.close)
    })
    kline.ignoreIncomplete = true
    let real2 = kline.RSI(2, 1)
    assert.equal( real1.result.outReal[0], real2 )
  })



})