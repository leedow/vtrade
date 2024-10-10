var assert = require('assert')
var Kline = require('../../core/feed/kline')
var KlineMix = require('../../core/feed/klineMix')
var helper = require('../../core/tools/helper')

describe('测试klineMix',function(){

  const d1 = [{
    id: 1,
    close: 100,
    stime: 1
  },{
    id: 300001,
    close: 101,
    stime:300001
  }]

  const d2 = [{
    id: 1,
    close: 500,
    stime: 1
  },{
    id: 300001,
    close: 505,
    stime: 300001
  },{
    id: 600001,
    close: 502,
    stime: 600001
  }]


  const d3 = [{
    id: 1,
    close: 800,
    stime: 1
  },{
    id:300001,
    close: 802,
    stime: 300001
  },{
    id:600001,
    close: 810,
    stime: 600001
  }]


  let k1 = new Kline({
    id: 300,
    ktype: 300
  })

  let k2 = new Kline({
    id: 300,
    ktype: 300
  })

  let k3 = new Kline({
    id: 300,
    ktype: 300
  })

  d1.forEach(item => {
    k1.remember(item)
  })
  d2.forEach(item => {
    k2.remember(item)
  })
  d3.forEach(item => {
    k3.remember(item)
  })


  let klineMix = new KlineMix({
    type: 300
  })

   

  it('addKline',function(){
    klineMix.addKline({
      name: 1,
      kline: k1
    })
    assert.equal( klineMix.klines.length, 1)

    klineMix.addKline({
      name: 2,
      kline: k2
    })
    assert.equal( klineMix.klines.length, 2)

    klineMix.addKline({
      name: 3,
      kline: k3
    })
    assert.equal( klineMix.klines.length, 3)
    
  })


  it('update',function(){
    klineMix.update()

    assert.equal( klineMix.klines[0].rate, 1/100)
    assert.equal( klineMix.klines[1].rate, 1/500)
    assert.equal( klineMix.klines[2].rate, 1/800)

    assert.equal( klineMix.startTime,  1 )
    assert.equal( klineMix.endTime, 600001 )




    let last = klineMix.kline.getLast()
    assert.equal( last.close, (101/100 + 505/500 + 802/800)/3)



    assert.equal( klineMix.kline.data.length,2)
    
  })

   

})
 
