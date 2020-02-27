var assert = require('assert')
var Tickers = require('../../core/feed/tickers')
var helper = require('../../core/tools/helper')

let tickers = new Tickers()
describe('测试tickers模块',function(){
  it('添加新数据',function(){
    tickers.remember([1,2,3,4,5,6])
    assert.equal( tickers.data.length, 1)
    tickers.remember([6,5,4,3,2,1])
    assert.equal( tickers.data.length, 2)
  })

  it('测试获取时间戳',function(){

    assert.equal( tickers.getTime(), 0)

  })

  it('遗忘数据',function(){
    tickers.forget()
    assert.equal( tickers.data.length, 0)
  })

  it('livePrices',function(){
    tickers.remember([1,2,3,4,5,6])
    tickers.remember([1,2,4,4,5,6])
    tickers.remember([1,2,5,4,3,6])

    assert.equal( tickers.LIVE_PRICE.length, 1 )
    assert.equal( tickers.LIVE_BUY_PRICE.length, 3 )
    assert.equal( tickers.LIVE_SELL_PRICE.length, 2 )

    assert.deepEqual( tickers.LIVE_PRICE, [1] )
    assert.deepEqual( tickers.LIVE_BUY_PRICE, [3,4,5] )
    assert.deepEqual( tickers.LIVE_SELL_PRICE, [5,3] )

  })

  it('get part',function(){
    tickers.remember([1,2,5,4,3,6])

    assert.deepEqual( tickers.getPart('PRICE', 3), [1,1,1] )
    assert.deepEqual( tickers.getPart('BUY_PRICE', 3), [4,5,5] )
    assert.deepEqual( tickers.getPart('SELL_PRICE', 3), [5,3,3] )

    assert.deepEqual( tickers.getPart('PRICE', 1), [1] )
    assert.deepEqual( tickers.getPart('BUY_PRICE', 1), [5] )
    assert.deepEqual( tickers.getPart('SELL_PRICE', 1), [3] )

    assert.deepEqual( tickers.getPart('PRICE', 1, 3), [1] )
    assert.deepEqual( tickers.getPart('BUY_PRICE', 1, 3), [4] )
    assert.deepEqual( tickers.getPart('SELL_PRICE', 1, 3), [5] )

    assert.deepEqual( tickers.getPart('LIVE_PRICE', 2), [1] )
    assert.deepEqual( tickers.getPart('LIVE_BUY_PRICE', 2), [4,5] )
    assert.deepEqual( tickers.getPart('LIVE_SELL_PRICE', 2), [5,3] )
  })

  it('getEMA',function(){
    tickers.remember([6,5,4,3,2,1])

    // console.log(tickers.getPart('BUY_PRICE', 5))
    // 3,4,5,5,4
    assert.equal( tickers.getEMA('PRICE', 5), helper.ema( tickers.getPart('PRICE', 5), 5) )
    assert.equal( tickers.getEMA('BUY_PRICE', 5), helper.ema( [3,4,5,5,4], 5) )
    assert.equal( tickers.getEMA('SELL_PRICE', 5), helper.ema( tickers.getPart('SELL_PRICE', 5), 5) )


  })

  it('getMA',function(){
    assert.equal( tickers.getMA('PRICE', 5), helper.ma( tickers.getPart('PRICE', 5), 5) )
    assert.equal( tickers.getMA('BUY_PRICE', 5), helper.ma( [3,4,5,5,4], 5) )
    assert.equal( tickers.getMA('SELL_PRICE', 5), helper.ma( tickers.getPart('SELL_PRICE', 5), 5) )

  })

  //
  it('测试获取时间戳',function(){
    tickers.remember([9170,0.003,9169.9,1.07564736,9170,4.6480859,9546.9,9673,9100,42473.00848722,398965954.561891,1582695763305])
    assert.equal( tickers.getTime(), 1582695763305)

  })


})
