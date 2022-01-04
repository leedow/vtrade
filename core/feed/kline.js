let Base = require('./base')
let helper = require('../tools/helper')
let talib = require('talib')
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
    this.initTalib()
  }

  /*
   * 初始化talib参数
   */
  initTalib() {
    talib.functions.forEach(func => {
      let explain = talib.explain(func.name)
      let inputs = []

      explain.inputs.forEach(input => {
        if( input.flags ) {
          let keys = Object.keys(input.flags)
          if( keys.length > 0 ) {
            keys.forEach(key => {
              inputs.push({
                name: key
              })
            })
          } else {
            inputs.push({
              name: input.name
            })
          }
        } else {
          inputs.push({
            name: input.name
          })
        }
      })

      explain.optInputs.forEach(input => {
        inputs.push({
          name: input.name
        })
      })

      this.talibConfig[func.name] = {
        name: explain.name,
        inputs
      }

      //this.talib[explain.name] = this._handle
    })
  }

  talib(name, options) {
    if(this.data.length < 2) {
      //this.error('data length is less than 2')
      return
    }

    if(!this.talibConfig[name]) {
      this.error(`do not suport ${name}`)
      return
    }

    try {
      let params = {
        name,
        startIdx: this.data.length-1,
        endIdx: this.data.length-1
      }

      for (let key in options) {
        if(key == 'step') {
          params['optInTimePeriod'] = options[key]
        } else if(key == 'ma') {
          params['optInMAType'] = mas[key]
        } else if(key == 'start') {
          params['startIdx'] = options[key]
        } else if(key == 'size') {
          params['startIdx'] = Math.max(0, params.startIdx-options[key])
        } else if(key == 'end') {
          params['endIdx'] = options[key]
        } else {
          params[key] = options[key]
        }
      }

      let data = this.getData()

      if( this.ignoreIncomplete ) {
        let tmp = []
        let last = data[data.length-1]

        if( last['etime'] - last['stime'] < this.ktype*1000 - 1 ) {
          if(this.data.length < 3) return

          for (let i = 0; i < data.length-1; i++) {
            tmp.push(data[i])
          }

          data = tmp

          params.endIdx = params.endIdx-1
          params.startIdx = Math.max(0, params.startIdx-1)

        }   
      }


      params.high = data.map(item => item.high)
      params.low = data.map(item => item.low)
      params.open = data.map(item => item.open)
      params.close = data.map(item => item.close)
      params.inReal = data.map(item => item.close)
      //console.dir( talib.explain(name), {depth:null} )

      let res = talib.execute(params)

      if(Object.keys(res.result).length == 1) {
        return res.result.outReal.length==1?res.result.outReal[0]:res.result.outReal
      } else {
        return res.result
      }

    } catch(e) {
      this.error(`talib ${name} wrong`, e)
      console.dir( talib.explain(name), {depth:null} )
    }
  }

  RSI(step=14, size = 1) {
    return this.talib('RSI', {step, size: size-1})
  }

  MA(step=30, size = 1) {
    return this.talib('MA', {step, ma: 'MA', size: size-1})
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

  EMA(step=30, size = 1) {
    return this.talib('EMA', {step, ma: 'EMA', size: size-1})
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

  SMA(step=30, size = 1) {
    return this.talib('SMA', {step, ma: 'SMA', size: size-1})
  }

  ATR(step=14 , size = 1) {
    return this.talib('ATR', {step, size: size-1})
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

  ADX(step=14 , size = 1) {
    return this.talib('ADX', {step, size: size-1})
  }

  BOLL(step=5, up=2, down=2, ma="EMA", size = 1) {
    try {
      let boll = this.talib('BBANDS', {
        optInTimePeriod: step,
        optInNbDevUp: up,
        optInNbDevDn: down,
        optInMAType: mas[ma],
        size: size - 1
      })

      if(boll.outRealUpperBand && boll.outRealUpperBand.length>0) {
        return {
          upper: boll.outRealUpperBand.length>1?boll.outRealUpperBand:boll.outRealUpperBand[0],
          lower: boll.outRealLowerBand.length>1?boll.outRealLowerBand:boll.outRealLowerBand[0],
          middle: boll.outRealMiddleBand.length>1?boll.outRealMiddleBand:boll.outRealMiddleBand[0],
        }

      } else {
        return {upper:0, lower:0, middle:0}
      }

    } catch(e) {
      this.error(e)
      return {upper:0, lower:0, middle:0}
    }
  }

  KDJ(k1=5, k2=3, d=3, ma='EMA', size = 1) {
    try {
      let kd = this.talib('STOCH', {
        optInFastK_Period: k1,
        optInSlowK_Period: k2,
        optInSlowK_MAType: mas[ma],
        optInSlowD_Period: d,
        optInSlowD_MAType: mas[ma],
        size: size - 1
      })

      if(kd.outSlowK && kd.outSlowK.length>0) {
        let J = []
        kd.outSlowK.forEach((item, index) => {
          J.push( 3*item - 2*kd.outSlowD[index] )
        })

        return {
          K: kd.outSlowK.length>1?kd.outSlowK:kd.outSlowK[0],
          D: kd.outSlowD.length>1?kd.outSlowD:kd.outSlowD[0],
          J: J.length>1?J:J[0]
        }

      } else {
        return {K:0, D:0, J:0}
      }
      
    } catch(e) {
      this.error(e)
      return {K:0, D:0, J:0}
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
