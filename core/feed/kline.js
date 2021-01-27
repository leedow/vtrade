let Base = require('./base')
let helper = require('../tools/helper')

/**
 * K线模块
 * 数据结构： {id,high,low,open,close,vol,stime,etime}
 */
module.exports = class Kline extends Base{
  constructor(options) {
    super()
    super.name = 'KLINE MODEL'
    this.id = null
    this.ktype = 60 // K线时间类型，单位s，如60代表一分钟K线
    this.readTickers = true // 是否从tickers自动计算
    this.copyOptions(options)
  }

  /*
   * 如果data中包含id，用id判重，否则用stime判重
   * @params {object} data 完整的k数据
   * @params {number} time 记录时间
   */
  remember(data, time) {
    let last = this.getLast(1, true)
    if(!last) {
        super.remember(data, time)
        return
    }

    if(data.id && last.d.id) {
      if(data.id == last.d.id) {
        this.updateLast(data)
      } else {
        super.remember(data, time)
      }
    } else {
      if(data.stime == last.d.stime) {
        this.updateLast(data)
      } else {
        super.remember(data, time)
      }
    }
  }

  /*
   * 从tickers数据实时生成K线数据
   * @params {Tickers object} tickers 标准的tickers模块对象
   */
  transTickers(tickers) {
    let lastTime = this.getTime()
    let tiks = tickers.getAfterTime(lastTime)

    for (var i = 0; i < tiks.length; i++) {
      if(lastTime == 0) {
        this.remember({
          id: tiks[i][11],
          high: tiks[i][0],
          low: tiks[i][0],
          open: tiks[i][0],
          close: tiks[i][0],
          vol: 0,
          stime: tiks[i][11],
          etime: tiks[i][11]
        }, tiks[i][11])
      } else if(lastTime>0) {
        if( tiks[i][11] - lastTime < this.ktype*1000 ) {
          let lastk = this.getLast()
          lastk.high = Math.max(lastk.high, tiks[i][0])
          lastk.low = Math.min(lastk.low, tiks[i][0])
          lastk.close = tiks[i][0]
          lastk.etime = tiks[i][11]
          this.updateLast(lastk)
        } else {
          let id = lastTime + this.ktype*1000
          this.remember({
            id: id,
            high: tiks[i][0],
            low: tiks[i][0],
            open: tiks[i][0],
            close: tiks[i][0],
            vol: 0,
            stime: tiks[i][11],
            etime: tiks[i][11]
          }, id )
        }
      }

      lastTime = this.getTime()
    } // end for

  }

}
