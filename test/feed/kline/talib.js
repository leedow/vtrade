var assert = require('assert')
var Kline = require('../../../core/feed/kline')
var Tickers = require('../../../core/feed/tickers')
var helper = require('../../../core/tools/helper')

describe('测试feed/kline模块指标计算',function(){
  let kline = new Kline()
  let tickers = new Tickers()

  kline.filterSame = false
  kline.memoryTimeLimit = 99999999999999999
  kline.ktype = 60
  tickers.filterSame = false
  tickers.memoryTimeLimit = 99999999999999999

  let now = Date.now()
  let n = 0
  const nextTime = () => {
    now =  now + parseInt(10000*Math.random())
    return now
  }

  const randomPrice = () => {
    return Number ( (1000*Math.random()).toFixed(2)  )
  }

  const getK = (size=1000) => {
    let res = []
    while(size--) {
      res.push([randomPrice(), 0,0,0,0,0,0,0,0,0,0, nextTime()])
      n++
    }
    return res
  }

  let k = getK()

  k.forEach(item => {
    tickers.remember(item, item[11])
  })

  kline.transTickers(tickers)

  it('RSI',function(){
    assert.equal( typeof kline.RSI(14),  'number' )
  })

  it('RSI size 2',function(){
    assert.equal( kline.RSI(14, 2).length,  2 )
  })

  it('MA',function(){
    assert.equal( typeof kline.MA(14),  'number' )
  })

  it('ma',function(){
    assert.equal( kline.MA(14),  kline.ma(14) )
  })

  it('EMA',function(){
    assert.equal( typeof kline.EMA(14),  'number' )
  })

  it('ema',function(){
    //assert.equal(  kline.SMA(13),  kline.ema(13) )
  })

  it('SMA',function(){
    assert.equal( typeof kline.SMA(14),  'number' )
  })

  it('SMA size 2',function(){
    assert.equal(  kline.SMA(14,2).length,  2 )
  })

  it('ATR',function(){
    assert.equal( typeof kline.ATR(14),  'number' )
  })

  it('ATR size 2',function(){
    assert.equal(  kline.ATR(14,2).length,  2 )
  })


})