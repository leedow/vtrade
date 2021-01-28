let Base = require('./base')
let helper = require('../tools/helper')
let talib = require('talib')
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
      console.error('data length is less than 2')
      return
    }

    if(!this.talibConfig[name]) {
      console.error(`do not suport ${name}`)
      return
    }

    let mas = {
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
      console.error(`talib ${name} wrong`, e)
      console.dir( talib.explain(name), {depth:null} )
    }
  }


  RSI(step, size = 1) {
    return this.talib('RSI', {step, size: size-1})
  }

  EMA(step, size = 1) {
    return this.talib('EMA', {step, ma: 'EMA', size: size-1})
  }

  SMA(step, size = 1) {
    return this.talib('SMA', {step, ma: 'SMA', size: size-1})
  }

  ATR(step , size = 1) {
    return this.talib('ATR', {step, size: size-1})
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
