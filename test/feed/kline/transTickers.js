var assert = require('assert')
var Kline = require('../../../core/feed/kline')
var Tickers = require('../../../core/feed/tickers')
var helper = require('../../../core/tools/helper')


describe('测试feed/kline模块转换tickers固定数据',function(){
  let kline = new Kline()
  let tickers = new Tickers()

  kline.filterSame = false
  kline.ktype = 2
  tickers.filterSame = false

  const k = [
    [100, 0,0,0,0,0,0,0,0,0,0, 1000],
    [50, 0,0,0,0,0,0,0,0,0,0, 2002],
    [60, 0,0,0,0,0,0,0,0,0,0, 3004],
    [20, 0,0,0,0,0,0,0,0,0,0, 3998],
    [60, 0,0,0,0,0,0,0,0,0,0, 5005],
    [30, 0,0,0,0,0,0,0,0,0,0, 6000]
  ]

  k.forEach(item => {
    tickers.remember(item, item[11])
  })

  it('测试生成K线',function(){
    kline.transTickers(tickers)
    assert.equal( kline.data.length, 3)
    assert.deepEqual( kline.getData(), [{
      id: 1000,
      high: 100,
      low: 50,
      open: 100,
      close: 50,
      vol: 0,
      stime: 1000,
      etime: 2002
    },{
      id: 3000,
      high: 60,
      low: 20,
      open: 60,
      close: 20,
      vol: 0,
      stime: 3004,
      etime: 3998
    },{
      id: 5000,
      high: 60,
      low: 30,
      open: 60,
      close: 30,
      vol: 0,
      stime: 5005,
      etime: 6000
    }])
  })


  it('测试2次生成K线',function(){
    tickers.remember([300, 0,0,0,0,0,0,0,0,0,0, 7000], 7000)
    kline.transTickers(tickers)
    assert.equal( kline.data.length, 4)
    assert.deepEqual( kline.getData(), [{
      id: 1000,
      high: 100,
      low: 50,
      open: 100,
      close: 50,
      vol: 0,
      stime: 1000,
      etime: 2002
    },{
      id: 3000,
      high: 60,
      low: 20,
      open: 60,
      close: 20,
      vol: 0,
      stime: 3004,
      etime: 3998
    },{
      id: 5000,
      high: 60,
      low: 30,
      open: 60,
      close: 30,
      vol: 0,
      stime: 5005,
      etime: 6000
    },{
      id: 7000,
      high: 300,
      low: 300,
      open: 300,
      close: 300,
      vol: 0,
      stime: 7000,
      etime: 7000
    }])
  })
})


describe('测试feed/kline模块转换仿真随机tickers数据',function(){
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

  const getK = (size=10000) => {
    let res = []
    while(size--) {
      res.push([randomPrice(), 0,0,0,0,0,0,0,0,0,0, nextTime()])
      n++
    }
    return res
  }



  let k = getK()


  const getInfo = (stime, etime) => {
    let res = k.filter(item => {
      return item[11]>=stime && ( item[11] < etime )
    })

    let prices = res.map(item => item[0])
 
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      open: prices[0],
      close: prices[prices.length-1]
    }
  }

  k.forEach(item => {
    tickers.remember(item, item[11])
  })

  it('测试生成K线数量',function(){
    kline.transTickers(tickers)
    assert.equal( kline.data.length, Math.ceil( (k[k.length-1][11]- k[0][11])/(kline.ktype*1000) ) )
  })

  it('随机测试K线样本',function(){
    let random = kline.getLast(  Math.floor(kline.data.length*Math.random()) )
    let right = getInfo(random.id, random.id+kline.ktype*1000)
    assert.equal( random.high, right.high )
    assert.equal( random.low, right.low )
    assert.equal( random.open, right.open )
    assert.equal( random.close, right.close )
  })

  it('测试生成新K线',function(){

    let k2 = getK(1000)

    k2.forEach(item => {
      tickers.remember(item, item[11])
    })

    k = k.concat(k2)

    kline.transTickers(tickers)
    assert.equal( kline.data.length, Math.ceil( (tickers.getLast()[11]- tickers.getFirst()[11])/(kline.ktype*1000) ) )

  })

  it('随机测试K线样本',function(){
    let random = kline.getLast(  Math.floor(kline.data.length*Math.random()) )
    let right = getInfo(random.id, random.id+kline.ktype*1000)
    assert.equal( random.high, right.high )
    assert.equal( random.low, right.low )
    assert.equal( random.open, right.open )
    assert.equal( random.close, right.close )
  })

})
