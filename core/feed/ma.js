let Queue = require('./queue')
let helper = require('../tools/helper')

/**
 * data为[number...]的数据队列处理器
 */
module.exports = class Ma{
  constructor(options) {
    super.name = 'MA MODEL'
    this.id = null
    this.type = 'ma' // ma | ema
    this.step = 0 // 均值计算参数
    this.mode = 'tickersNumber'  // tickersNumber | timestep
    this.timestepFilter = 0 // mode为timestep时数据采样间隔

    this.origin = new Queue() //  原始数据队列
    this.self = new Queue() // 处理后数据队列
    this.self.filterSame = false
    this._copyOptions(options)

  }

  /**
   * 初始化参数
   */
  _copyOptions(options) {
    if(typeof options == 'object') {
      for(let key in options) {
        this[key] = options[key]
      }
    }
  }

  get data() {
    return this.self.data
  }

  remember(onedata, time = 0) {
    let res = this.origin.remember(onedata, time)

    if(this.type == 'ma' && res) {
      this._ma(time)
    } else if(this.type == 'ema' && res) {
      this._ema(time)
    } else {
      console.error('Feed ma model:wrong mode setting!')
    }

  }

  getTrend(step, offset=1) {
    return this.self.getTrend(step, offset)
  }

  _ma(time) {
    let d = 0
    if(this.mode == 'tickersNumber') {
      d = this.origin.getAvg(this.step)
    } else if(this.mode == 'timestep') {
      d = this.origin.getAvgByTimeStep(this.step, this.timestepFilter)
    }
    this.self.remember(d, time)
  }

  _ema() {
    // todo
  }


}
