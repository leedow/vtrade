let Core = require('../common/core')

module.exports = class Base extends Core {
  constructor() {
    super()
    this.name = ''
    this.data = []
    this.memorySize = 999 // 最大记忆长度
    this.memoryTimeLimit = 3600*1000 // 单位为MS的最长记忆时间
    this.filterSame = false // 是否开启去重，开启后与当前最后数据相同数据将被忽略
  }

  /**
   * 记忆数据，如果超出限制长度则移除旧数据
   * 其中限制长度分为1.memorySize 2.memoryTimeLimit 两种，以大者为准
   * @param {object} onedata 记忆数据
   * @param {number} time 单位为ms的时间戳，若不传则进入无时间戳记忆模式
   */
  remember(onedata, time=0) {

      if( this.filterSame ) {
        let last = this.getLast()
        if( JSON.stringify(last) == JSON.stringify(onedata) ) return
      }

      this.data.push({
        t: time,
        d: onedata
      })
      if( this._hasTime() ) {
        if(
          this.data.length > this.memorySize
          && ( time - this.data[0]['t'] > this.memoryTimeLimit )
        ){
          this.data.shift()
        }
      } else {
        if(
          this.data.length > this.memorySize
        ){
          this.data.shift()
        }
      }
  }

  forget() {
    this.data = []
  }

  /**
   * 检查是否是包含时间维度的数据
   */
  _hasTime() {
    if(this.data.length > 0) {
      if(this.data[0]['t'] > 0) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }

  /**
   * 获取时间戳，单位MS
   * @param {number} offset 获取倒数第index个数据
   */
  getTime(offset) {
    let data = this.getLast(offset, true)
    try{
        return data['t']||0
    } catch(e) {
        return 0
    }
  }

  /**
   * 返回无时间戳数据队列
   */
  getData(withTime=false) {
    return withTime?this.data:this.data.map(item => item.d)
  }

  /**
   * 根据时间间隔抽样获取数据队列
   * @param {numeber} times 单位毫秒的时间范围内
   * @param {number} timeStep 单位毫秒的时间间隔
   */
  getDataByTimeStep(times, timeStep=0, withTime=false) {
    let datas = this.getWithinTime(times, true).reverse()
    let results = []
    let lastTime = 0
    datas.forEach(data => {
      if(results.length == 0) {
        results.unshift(data)
        lastTime = data.t
      }
      if(
        results.length > 0
        && ( lastTime - data.t >= timeStep )
      ) {
        results.unshift(data)
        lastTime = data.t
      }
    })
    return withTime?results:results.map(item => item.d)
  }

  /**
   * 获取记忆数据的时间长度
   * @return 单位ms
   */
  getTimeSpan() {
    if(!this._hasTime()) return 0
    return this.data[this.data.length-1]['t'] - this.data[0]['t']
  }

  /**
   * 获取第一个数据，若不存在返回false
   */
  getFirst(offset=1, withTime=false){
    offset = offset<1?1:offset
    let i = offset>=this.data.length?this.data.length-1:offset-1
    if(this.data.length == 0) return false
    return withTime?this.data[i]:this.data[i]['d']
  }

  /**
   * 获取倒数第index个数据
   */
  getLast(offset=1, withTime=false) {
    let i = this.data.length-offset
    i = i<0?0:i
    if(this.data.length == 0) return false
    return withTime?this.data[i]:this.data[i]['d']
  }

  /**
   * 获取多少时间前的数据
   * @param {number} time 单位ms的时间戳
   */
  getTimeBefore(time, withTime=false) {
    let aims = this.data.filter(item => item.t - (this.getTime()-time) >= 0)
    if(aims.length == 0) return null
    return withTime?aims[0]:aims[0]['d']
  }

  /**
   * 获取多少时间内的数据
   */
  getWithinTime(time, withTime=false) {
    let aims = this.data.filter(item => item.t - (this.getTime()-time) >= 0)
    if(aims.length == 0) return null
    return withTime?aims:aims.map(item => item.d)
  }

  /**
   * 获取部分数据
   * @param {array} data 不包含时间戳的data
   * @param {number} length 获取数组长度
   * @param {number} offset 向前偏移offset个数组位置
   */
  getPart(data, length, offset=1) {
    let len = data.length
    let endindex = len - offset + 1
    let startindex = endindex - length
    if(endindex < 0) endindex = 1
    if(startindex < 0) startindex = 0

    return data.slice(startindex, endindex)
  }

  log(content) {
    console.log(content)
  }

  error(content) {
    console.error(content)
  }

}
