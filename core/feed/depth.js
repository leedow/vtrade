let Base = require('./base')
let helper = require('../tools/helper')

/**
 * 订单模块
 * depth数据结构: {asks: [[price, size]], bids: [[price, size]], time}
 * 其中asks,bids的档位顺序为 [一档, 二挡.....]
 */
module.exports = class Depth extends Base{
  constructor(options) {
    super()
    super.name = 'DEPTH MODEL'
    this.id = null
    this.copyOptions(options)
  }

  remember(depth) {
    super.remember(depth, depth.time)
  }

  /**
   * 获取指定档位买价
   */
  getBidPrice(level=1) {
    let last = this.getLast()
    return Number( last['bids'][level-1][DEPTH_PRICE] )
  }

  /**
   * 获取指定档位卖价
   */
  getAskPrice(level=1) {
    let last = this.getLast()
    return Number( last['asks'][level-1][DEPTH_PRICE] )
  }

}
