let Base = require('./base')
let helper = require('../tools/helper')

/**
 * data为[{value,count}...]的数据队列统计器
 */
module.exports = class Group extends Base{
  constructor(options) {
    super()
    super.name = 'GROUP MODEL'
    this.id = null
    this.copyOptions(options)
    this.memorySize = 9999
  }

  /**
   * 记录一项数组，不存在插入新data，已存在则自增count
   * @param {number} value 数据值
   * @param {number} count 数据数量
   */
  remember(value, count) {
    let index = this.data.findIndex(item => item.value == value)
    if(index >= 0) {
      this.data[index]['count'] += count
    } else {
      this.remember
    }
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
