let Base = require('./base')
let helper = require('../tools/helper')

/**
 * data为[number...]的数据队列处理器
 */
module.exports = class Queue extends Base{
  constructor(options) {
    super()
    super.name = 'QUEUE MODEL'
    this.id = null
    this.copyOptions(options)
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

  /**
   * 获取所有数据的均值
   */
  getAvg() {
    let avg = 0
    this.data.forEach(data => {
      avg += data/this.data.length
    })
    return avg
  }

  /**
   * 获取最大值
   */
  getMax() {
    return Math.max(...this.data)
  }

  /**
   * 获取最小值
   */
  getMin() {
    return Math.min(...this.data)
  }
}