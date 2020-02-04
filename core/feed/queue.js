let Base = require('./base')
let helper = require('../tools/helper')

/**
 * data为[number...]的数据队列处理器
 */
module.exports = class Queue extends Base{
  constructor() {
    super()
    super.name = 'QUEUE MODEL'
  }

  /**
   * 指定位置数据变化幅度
   * @param {number} step 对比数据大小步长
   * @param {number} offset 从后往前的偏移量
   */
  getTrend(step, offset=1) {
    let last = this.getLast(offset)
    let pre = this.getLast(offset+step)
    return (last - pre)/pre
  }
}
