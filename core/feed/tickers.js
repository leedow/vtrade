let Base = require('./base')

/**
 * Ticker data 数据结构
 [["最新成交价",
  "最近一笔成交的成交量",
  "最大买一价",
  "最大买一量",
  "最小卖一价",
  "最小卖一量"]]
 */
module.exports = class Tickers extends Base{
  constructor() {
    super()
    super.name = 'TICKER MODEL'

    this.keys = {
      PRICE: 0,
      AMOUNT: 1,
      BUY_PRICE: 2,
      BUY_AMOUNT: 3,
      SELL_PRICE: 4,
      SELL_AMOUNT: 5
    }

    this.liveKeys = []

    Object.keys(this.keys).forEach(key => {
      this.liveKeys.push(`LIVE_${key}`)
      this[`LIVE_${key}`] = []
    })
  }

  forget() {
    super.forget()
    this.liveKeys.forEach(key => {
      this[key] = []
    })
  }

  getPart(name, length, offset=1) {
    if(this[name]) {
      return super.getPart(this[name], length, offset)
    } else {
      return super.getPart(super.getData(), length, offset).map(item => item[ this.keys[name] ])
    }
  }

  /**
   * 记录变化数据
   */
  _pushDif(name, value) {
    if(!this[name]) {
      super.error(`_pushDif():${name} do not exsit!`)
      return
    }

    if(this[name].length == 0) {
      this[name].push(value)
    } else {
      if(value != this[name][ this[name].length-1 ]) {
        this[name].push(value)
      }
    }
  }

  remember(data) {
    super.remember(data)
    Object.keys(this.keys).forEach(key => {
      this._pushDif(`LIVE_${key}`, data[ this.keys[key] ])
    })
  }


}
