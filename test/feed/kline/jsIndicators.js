var assert = require('assert')
var Kline = require('../../../core/feed/kline')
var Tickers = require('../../../core/feed/tickers')
var helper = require('../../../core/tools/helper')
let talib = require('talib')

describe('测试feed/kline模块指标计算，原生js计算的指标',function(){
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
    etime: st + 3*60000 + 59999
  },{
    id: st + 4*60000,
    high: 320,
    low: 11,
    open: 72,
    close: 85,
    stime: st + 4*60000,
    etime: st + 4*60000 + 59994
  }]

  const ks2 = [ks[0], ks[1], ks[2]]

  ks.forEach(k => {
    kline.remember(k)
  })
 
  it('ma',function(){
    assert.equal( kline.ma(2), (85+77)/2 )
    assert.equal( kline.ma(3), (85+77+70)/3 )
  })
  
  it('ema',function(){
    assert.equal( kline.ema(2), 85*2/(2+1) + 77*2/(2+1)*Math.pow(1/3, 1) + 70*2/(2+1)*Math.pow(1/3, 2) + 70*2/(2+1)*Math.pow(1/3, 3) + 40*2/(2+1)*Math.pow(1/3, 4) )
    assert.equal( kline.ema(3), 85*2/(3+1) + 77*2/(3+1)*Math.pow(1/2, 1) + 70*2/(3+1)*Math.pow(1/2, 2) + 70*2/(3+1)*Math.pow(1/2, 3) + 40*2/(3+1)*Math.pow(1/2, 4) )
  })

  it('sd',function(){
    let avg1 = (85+77)/2
    assert.equal( kline.sd(2), Math.sqrt( (85-avg1)*(85-avg1)/2 + (77-avg1)*(77-avg1)/2 ) )
  })

  it('ma with ignoreIncomplete',function(){
    kline.ignoreIncomplete = true
    assert.equal( kline.ma(2), (77+70)/2 )
    
  })

  it('ma with ignoreIncomplete offset 2',function(){
    kline.ignoreIncomplete = true
    assert.equal( kline.ma(2,1,1), (70+70)/2 )
  })

  it('ema with ignoreIncomplete',function(){
    kline.ignoreIncomplete = true

    assert.equal( kline.ema(2), 77*2/(2+1) + 70*2/(2+1)*Math.pow(1/3, 1) + 70*2/(2+1)*Math.pow(1/3, 2) + 40*2/(2+1)*Math.pow(1/3, 3) )
  

  })

 

  it('sd with ignoreIncomplete',function(){
    kline.ignoreIncomplete = true

    let avg1 = (70+77)/2
    assert.equal( kline.sd(2), Math.sqrt( (77-avg1)*(77-avg1)/2 + (70-avg1)*(70-avg1)/2 ) )
  })

 

})