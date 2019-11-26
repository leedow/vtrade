var assert = require('assert')
var Tickers = require('../../core/feed/tickers')

let tickers = new Tickers()
describe('测试tickers模块',function(){
  it('添加新数据',function(){
    tickers.remember([1,2,3,4,5,6])
    assert.equal( tickers.data.length, 1)
    tickers.remember([6,5,4,3,2,1])
    assert.equal( tickers.data.length, 2)
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

    //assert.deepEqual( [1,2,5,4,3,6], [1,2,5,4,3,6] )
  })

  it('get part',function(){
    tickers.remember([1,2,5,4,3,6])

    assert.deepEqual( tickers.getPart('PRICE', 3), [1,1,1] )
    assert.deepEqual( tickers.getPart('BUY_PRICE', 3), [4,5,5] )
    assert.deepEqual( tickers.getPart('SELL_PRICE', 3), [5,3,3] )

    assert.deepEqual( tickers.getPart('LIVE_PRICE', 2), [1] )
    assert.deepEqual( tickers.getPart('LIVE_BUY_PRICE', 2), [4,5] )
    assert.deepEqual( tickers.getPart('LIVE_SELL_PRICE', 2), [5,3] )
  })
})
