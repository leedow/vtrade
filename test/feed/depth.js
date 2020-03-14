var assert = require('assert')
var Depth = require('../../core/feed/depth')
var helper = require('../../core/tools/helper')

let depth = new Depth()
let t = Date.now()

let depth1 = {"asks":[["5806.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608264}
let depth2 = {"asks":[["5807.6","200","0","1"],["5807.8","4","0","1"],["5808.1","2","0","1"],["5808.8","58500","0","2"],["5810","6","0","6"]],"bids":[["5806.5","13055","0","11"],["5805.2","8","0","2"],["5800","101780","0","8"],["5790.9","55900","0","1"],["5790","1000","0","1"]],"time":1584020608265}


describe('测试depth模块',function(){
  it('添加新数据',function(){
    depth.remember(depth1)
    assert.equal( depth.data.length, 1)
    depth.remember(depth2)
    assert.equal( depth.data.length, 2)
  })

  it('获取档位参数',function(){
    let last = depth.getLast()
    let last2 = depth.getLast(2)
    assert.equal( last['asks'][0][DEPTH_PRICE], 5807.6 )
    assert.equal( last['asks'][0][DEPTH_SIZE], 200 )
    assert.equal( last['asks'][1][DEPTH_PRICE], 5807.8 )
    assert.equal( last['asks'][1][DEPTH_SIZE], 4 )

    assert.equal( last['bids'][0][DEPTH_PRICE], 5806.5 )
    assert.equal( last['bids'][1][DEPTH_PRICE], 5805.2 )

  })

  it('获取价格参数',function(){
    assert.equal( depth.getBidPrice(), 5806.5 )
    assert.equal( depth.getAskPrice(), 5807.6 )
    assert.equal( depth.getBidPrice(2), 5805.2 )
    assert.equal( depth.getAskPrice(2), 5807.8 )
  })
})
