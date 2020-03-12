let Base = require('./base')
let helper = require('../tools/helper')

/**
 * 订单模块
   trade数据结构: [price, size, side, time]
 */
module.exports = class Depth extends Base{
  constructor(options) {
    super()
    super.name = 'DEPTH MODEL'
    this.id = null
    this.copyOptions(options)
  }

  remember(order) {
    super.remember(order, order.time)
  }


}
