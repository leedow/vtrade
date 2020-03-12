let Base = require('./base')
let helper = require('../tools/helper')

/**
 * 订单模块
   trade数据结构: [price, size, side, time]
 */
module.exports = class Trades extends Base{
  constructor(options) {
    super()
    super.name = 'TRADES MODEL'
    this.id = null
    this.copyOptions(options)
  }

  remember(order) {
    super.remember(order, order[TRADE_TIME])
  }

  /**
   * 获取指定时间内的流入量
   */
  getBuyQt() {

  }

  /**
   * 获取指定时间内的流出量
   */
  getSellQt() {

  }

}
