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
  }

  /**
   * 记录一项数组，不存在插入新data，已存在则自增count
   * @param {number} value 数据值
   * @param {number} count 数据数量
   */
  remember(value, count) {
    let index = this.getData().findIndex(item => item.value == value)

    if(index >= 0) {
      this.data[index]['d']['count'] += count
    } else {
      super.remember({
        value: value,
        count: count
      })
    }
  }

  /**
   * 获取所有数据的value加权平均
   * @param {number} temp [{value, count}] 临时变量数据值
   */
  getAvg(temp=[]) {
    let v = 0, c = 0
    this.getData().forEach(data => {
      v += data.value*data.count
      c += data.count
    })
    temp.forEach(item => {
      v += item.value*item.count
      c += item.count
    })

    return v/c
  }

  /**
   * 获取value最大
   */
  getMax() {
    return Math.max(...this.getData().map(item => item.value) )
  }

  /**
   * 获取value最小值
   */
  getMin() {
    return Math.min(...this.getData().map(item => item.value) )
  }

  /**
   * 获取count总数
   */
  getTotalCount() {
    let total = 0
    this.getData().forEach(item => {
      total += item.count
    })
    return total
  }


}
