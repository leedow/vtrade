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
   * @param len 计算倒数最大个数长度
   */
  getAvg(len) {
    let avg = 0
    let tmp = this.getData()
    if(len && (len<tmp.length) ) {
      tmp = tmp.slice(tmp.length-len)
    }
    for (var i = 0; i < tmp.length; i++) {
      avg += tmp[i]/tmp.length
    }
    return avg
  }

  /**
   * 获取所有数据的均值
   * @param {numeber} times 单位毫秒的时间范围内
   * @param {number} timeStep 单位毫秒的时间间隔
   */
  getAvgByTimeStep(times, timeStep) {
    let avg = 0
    let aims = this.getDataByTimeStep(times, timeStep)
    aims.forEach(data => {
      avg += data/aims.length
    })
    return avg
  }

  /**
   * 获取最大值
   */
  getMax() {
    return Math.max(...this.getData())
  }

  /**
   * 获取最小值
   */
  getMin() {
    return Math.min(...this.getData())
  }


  getSD() {
    return helper.SD(this.getData())
  }

  /**
   * 获取总和
   */
  getSum() {
    let data = this.getData()
    let sum = 0
    data.forEach(item => {
      sum += item
    })
    return sum
  }

  /**
   * 获取某个时间段内的数据变化的百分比
   * @param {number} time 计算多少时间内的数据，单位ms
   * @param {number} beforeTime 向前偏移多少时间，单位ms
   */
  getPercentageByTime(time, beforeTime=0) {
    let data = this.getWithinTimeBefore(time, beforeTime)
    return data[0]>0?(data[data.length-1]-data[0])/data[0]:0
  }

  /**
   * 获取某个时间段范围内数据回撤的最大百分比
   * @param {number} time 计算多少时间内的数据，单位ms
   * @param {number} beforeTime 向前偏移多少时间，单位ms
   */
  getRetracementByTime(time, beforeTime=0) {
    return helper.maxRetracement(
      this.getWithinTimeBefore(time, beforeTime)
    )
  }

}
