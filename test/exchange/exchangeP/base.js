let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2

const EXCHANGE = 'test'
const PAIR = 'btcusd_p'

const event_name = (type) => {
  return `ROBOT_${type}_${EXCHANGE}_${PAIR}`
}

const TICKERS_EVENT = event_name('TICKERS')
const DEPTH_EVENT = event_name('DEPTH')
const KLINE_EVENT = event_name('KLINE')



describe('测试exchangeP币本位模块独立方法',function(){
  let ex = new Exchange({
    name: 'test',
    exchange: EXCHANGE,
    pair: PAIR,
    balance : 'btc',
    makerFee: -0.01,
    takerFee: 0.01,
    amountAcc: 2,
    priceAcc: 4,
    lever: LEVER
  })

  ex.getAsset('btc').balance = 100


  it('增加多仓',function(){
    ex.increasePosition('long', 100.123, 1.11, 1.321)
    assert.equal( ex.getAsset('long').balance, 1.11)
    assert.equal( ex.long.avgPrice, 100.123)
    assert.equal( ex.long.deposit, 1.321)
    assert.equal( ex.getAsset('btc').balance, 100)
    // assert.equal( ex.getAsset('btc').getFrozen(), ex.long.deposit)
  })

  it('继续增加多仓',function(){
    ex.increasePosition('long', 99.9, 2.11, 2.321)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, 1.321+2.321)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('平多部分',function(){
    ex.decreasePosition('long', 99.8, 1, 0)
    assert.equal( ex.getAsset('long').balance, 1.11+2.11-1)
    assert.equal( ex.long.avgPrice.toFixed(8), ((100.123*1.11+99.9*2.11)/(1.11+2.11)).toFixed(8))
    assert.equal( ex.long.deposit, (1.321+2.321)*(1.11+2.11-1)/(1.11+2.11) )
    assert.equal( ex.getAsset('btc').balance, 100 )
  })

  it('清空多仓',function(){
    ex.clearPosition('long', 0)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
  })

  it('开空1',function(){
    ex.increasePosition('short',100, 1, 1)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.short.avgPrice, 100)
    assert.equal( ex.short.deposit, 1)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('继续开空1',function(){
    ex.increasePosition('short',102, 1, 1)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 2)
    assert.equal( ex.getAsset('btc').balance, 100)
  })

  it('清空空仓',function(){
    ex.clearPosition('short', 0)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('btc').balance, 100  )
  })

  // 测试 updateAssets 逻辑C
  it('订单开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'long',
      deposit: 1/100/LEVER,
      fee: 1
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit, 1/100/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1)
  })

  // 逻辑C
  it('订单再次开多1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'long',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, 1/100/LEVER+1/102/LEVER)
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 2)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1)
  })

  // 逻辑E
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 101)
    assert.equal( ex.long.deposit, ( 1/100/LEVER+1/102/LEVER )*0.5  )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1  + 1/101-1/102  )
  })

  // 逻辑D
  it('开空2',function(){
    ex.updateAssets({
      amountFill: 2,
      price: 102,
      lever: LEVER,
      direction: 'short',
      deposit: 1/102/LEVER,
      fee: -1
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 102)
    assert.equal( ex.short.deposit, 1/102/LEVER/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  )
  })

  // 逻辑F
  it('开空1',function(){
    ex.updateAssets({
      amountFill: 1,
      price: 100,
      lever: LEVER,
      direction: 'short',
      deposit: 1/100/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, 1/102/LEVER/2 + 1/100/LEVER)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 2)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102) )
  })

  // 逻辑B
  it('开多1',function(){
    const PRICE = 103
    ex.updateAssets({
      amountFill: 1,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 1/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 0)
    assert.equal( ex.long.deposit, 0  )
    assert.equal( ex.short.avgPrice, 101)
    assert.equal( ex.short.deposit, (1/102/LEVER/2 + 1/100/LEVER)/2)
    assert.equal( ex.getAsset('long').balance, 0)
    assert.equal( ex.getAsset('short').balance, 1)
    assert.equal( ex.getAsset('btc').balance, 100 -1+1+1+1+ 1/101-1/102 + (1/101-1/102)  + (1/PRICE -1/101) )
  })

  // 逻辑B
  it('开多2',function(){
    const PRICE = 100
    const PRE_BALANCE = ex.getAsset('btc').balance
    ex.updateAssets({
      amountFill: 2,
      price: PRICE,
      lever: LEVER,
      direction: 'long',
      deposit: 2/PRICE/LEVER,
      fee: 0
    })
    assert.equal( ex.long.avgPrice, 100)
    assert.equal( ex.long.deposit,  1/PRICE/LEVER )
    assert.equal( ex.short.avgPrice, 0)
    assert.equal( ex.short.deposit, 0)
    assert.equal( ex.getAsset('long').balance, 1)
    assert.equal( ex.getAsset('short').balance, 0)
    assert.equal( ex.getAsset('btc').balance, PRE_BALANCE+1/100-1/101)
  })

  it('测试创建kline',function(){
     let k = ex.createKline(60)
     k.readTickers = true

      assert.deepEqual( ex.klines.length, 1)
     let k2 =ex.createKline(300)
     k2.readTickers = true

      assert.deepEqual( ex.klines.length, 2)
  })

  
  it('测试kline数据订阅',function(){
    const k1 = {id:1,high:100,low:1,open:2,close:98,vol:1,stime:1,etime:61, type:60}
    events.emit(KLINE_EVENT, k1)
    assert.deepEqual( ex.getKline(60).getLast(), k1)

    const k2 = {id:1,high:200,low:15,open:2,close:8,vol:1,stime:1,etime:61, type:300}
    events.emit(KLINE_EVENT, k2)
    assert.deepEqual( ex.getKline(300).getLast(), k2)
  })


  it('测试kline数据驱动下的getBidPrice',function(){
    assert.deepEqual( ex.getBidPrice(), 100)
      
  })

  it('测试kline数据驱动下的getAskPrice',function(){
     assert.deepEqual( ex.getAskPrice(), 1)

     ex.klines.forEach(kline => {
        kline.forget()
     })
  })

  


  it('测试获取kline',function(){
     
      assert.deepEqual( ex.getKline(60), ex.klines[0])
      assert.deepEqual( ex.getKline(60).haveData(), false)

      assert.deepEqual( ex.getKline(300), ex.klines[1])
      assert.deepEqual( ex.getKline(300).haveData(), false)

      assert.deepEqual( ex.getKline(900), undefined)
  
  })

  it('测试tickers数据订阅,及Kline更新',function(){
    events.emit(TICKERS_EVENT, [5000, 1, 4999, 2, 5001, 2])
    assert.deepEqual( ex.tickers.getLast(1), [5000, 1, 4999, 2, 5001, 2])
    events.emit(TICKERS_EVENT, [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( ex.tickers.getLast(1), [5001, 1, 4999.5, 2, 5001.2, 2])
    assert.deepEqual( ex.tickers.getLast(2), [5000, 1, 4999, 2, 5001, 2])

    assert.deepEqual( ex.getKline(60).haveData(), true)
    assert.deepEqual( ex.getKline(300).haveData(), true)
  })

  it('测试getBidPrice',function(){
    assert.deepEqual( ex.getBidPrice(), 4999.5)
  })

  it('测试getAskPrice',function(){
    assert.deepEqual( ex.getAskPrice(), 5001.2)
  })

  it('测试getPrice',function(){
    assert.deepEqual( ex.getPrice(), 5001)
  })

  it('测试tickers不完整数据',function(){
    events.emit(TICKERS_EVENT, [5000, 1, 0, 0, 0, 0])
    assert.deepEqual( ex.getBidPrice(), 5000)
    assert.deepEqual( ex.getAskPrice(), 5000)


  })

  it('测试depth数据订阅',function(){
    let depth1 = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}
    let depth2 = {"asks":[["5807.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608265}

    events.emit(DEPTH_EVENT, depth1)
    assert.deepEqual( ex.depth.getLast(1), depth1)
    events.emit(DEPTH_EVENT, depth2)
    assert.deepEqual( ex.depth.getLast(1), depth2)
    assert.deepEqual( ex.depth.getLast(2), depth1)
  })

  it('测试getBidPrice',function(){
    assert.equal( ex.getBidPrice(), 5806.5)
  })

  it('测试getAskPrice',function(){
    assert.equal( ex.getAskPrice(), 5807.6)
  })

  it('测试getPrice',function(){
    assert.deepEqual( ex.getPrice(), 5000)
  })

})
