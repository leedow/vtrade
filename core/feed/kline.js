let Base = require('./base')
let helper = require('../tools/helper')
//let talib = require('talib')
//let sig = require('trading-signals')


const mas = {
  'SMA'  : 0,
  'EMA'   : 1,
  'WMA'   : 2,
  'DEMA' : 3,
  'TEMA'  : 4,
  'TRIMA' : 5,
  'KAMA'  : 6,
  'MAMA'  : 7,
  'T3'    : 8
}
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
    this.readTickers = false // 是否从tickers自动计算
    this.ignoreIncomplete = false // 计算指标是否忽略最后一根未完结的K柱
    this.talibConfig = {}
    this.copyOptions(options)
    //this.initTalib()
  }



  ma(step=30, size = 1, offset=0) {
    if(size == 1) {
      return helper.ma(this.getDataIgnore(offset).map(item => item.close), step)
    } else {
      console.log('ma has not support size > 1 yet')
      return null
    }
    
  }

  volma(step=30, size = 1, offset=0) {
    if(size == 1) {
      return helper.ma(this.getDataIgnore(offset).map(item => item.vol||0), step)
    } else {
      console.log('volma has not support size > 1 yet')
      return null
    }
  }


  ema(step=30, size = 1, offset=0) {
    if(size == 1) {
      return helper.ema(this.getDataIgnore(offset).map(item => item.close), step) 
    } else {
      console.log('ema has not support size > 1 yet')
      return null
    } 
  }

  sd(step=30, size = 1) {
    if(size == 1) {
      return helper.SD(this.getDataIgnore().map(item => item.close), step) 
    } else {
      console.log('sd has not support size > 1 yet')
      return null
    } 
  }

  sdvol(step=30, size = 1) {
    if(size == 1) {
      return helper.SD(this.getDataIgnore().map(item => item.vol||0), step) 
    } else {
      console.log('sd has not support size > 1 yet')
      return null
    } 
  }

  sdp(step=30, size = 1) {
    if(size == 1) {
      return helper.SDP(this.getDataIgnore().map(item => item.close), step) 
    } else {
      console.log('sd has not support size > 1 yet')
      return null
    } 
  }


  atr(step=20, size = 1) {
    if(size == 1) {
      let ks = this.getDataIgnore()
      ks = ks.slice(-step-1)

      let trs = []

      for (let i = 0; i < ks.length; i++) {
        if(i > 0) {
          let pre = ks[i-1]
          let current = ks[i]

          let tr = Math.max( 
            current.high - current.low, 
            Math.abs(current.high-pre.close), 
            Math.abs(current.low - pre.close)
          )

          trs.push(tr)
        }
      }

      //console.log(ks, trs)

      return helper.ma(trs, step)

    } else {
      console.log('atr has not support size > 1 yet')
      return null
    } 
  }

  /**
   *  RSI指标
   * 
   */
  rsi(step=15, size = 1, offset = 0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      let priceChanges = []

      const aims = datas.slice(-(step+1))
      aims.forEach((item, index) => {
        if(index == 0) return
        priceChanges.push(aims[index]['close'] - aims[index-1]['close']) 
      })

      if(priceChanges.length == 0) return null
      console.log(priceChanges)

      const upward = priceChanges.filter(item => item > 0)
      const downward = priceChanges.filter(item => item < 0)

      const avgUpward = helper.sum(upward)/priceChanges.length
      const avgDownward = helper.sum(downward)/priceChanges.length

      const RS = Math.abs(avgUpward/avgDownward)

      return 100 - 100/(1+RS)

    } else {
      console.log('rsi has not support size > 1 yet')
      return null
    } 
  }

 


  /*
   * 如果data中包含id，用id判重，否则用stime判重
   * @params {object} data 完整的k数据
   * @params {number} time 记录时间
   * @return {code:boolean, event: update|create|wrong}
   */
  remember(data, time) {
    let last = this.getLast(1, true)
    if(!last) {
        super.remember(data, time)
        return {code: true, event: 'create'}
    }

    if(data.id && last.d.id) {
      if(data.id == last.d.id) {
        this.updateLast(data)
        return {code: true, event: 'update'}
      } else {
        let res = super.remember(data, time)
        return {code: res, event: res?'create':'wrong'}
      }
    } else {
      if(data.stime == last.d.stime) {
        this.updateLast(data)
        return {code: true, event: 'update'}
      } else {
        let res = super.remember(data, time)
        return {code: res, event: res?'create':'wrong'}
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

  /*
   * 根据是否设置ignoreIncomplate参数返回data
   * @params {number} 舍弃后面的几位
   */
  getDataIgnore(offset=0) {
    let data = this.getData()

    try {
      if( this.ignoreIncomplete ) {
        let tmp = []
        let last = data[data.length-1]

        if( last['etime'] - last['stime'] < this.ktype*1000 - 1 ) {
          for (let i = 0; i < data.length-1; i++) {
            tmp.push(data[i])
          }

          data = tmp
        }   
      }

      return offset>0?data.slice(0,data.length-offset):data
    } catch(e) {
      //console.log(e)
      return []
    }

     
  }

}
