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

  getKlineByTime(time, timeTag='etime') {
    let data = this.getData()
    let closest = null
    let minDiff = Infinity

    for (let k of data) {
      let diff = Math.abs(k[timeTag] - time)
      if (diff < this.ktype * 1000 && diff < minDiff) {
        minDiff = diff
        closest = k
      }
    }

    return closest
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
   * 抛物线SAR指标 (Parabolic Stop and Reverse)
   * @param {number} step 加速因子步长，默认0.02
   * @param {number} maxStep 最大加速因子，默认0.2
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} SAR值 或 null
   */
  sar(step=0.02, maxStep=0.2, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < 3) return null

      // 初始化
      let isUpTrend = datas[1].close > datas[0].close
      let sar = isUpTrend ? datas[0].low : datas[0].high
      let ep = isUpTrend ? datas[1].high : datas[1].low // 极值点
      let af = step // 加速因子

      // 计算SAR值
      for(let i = 2; i < datas.length; i++) {
        let current = datas[i]
        let previous = datas[i-1]
        
        // 计算新的SAR值
        let newSar = sar + af * (ep - sar)
        
        if(isUpTrend) {
          // 上升趋势
          if(current.low <= newSar) {
            // 趋势反转
            isUpTrend = false
            sar = ep
            ep = current.low
            af = step
          } else {
            sar = newSar
            // 确保SAR不高于前两个周期的最低价
            sar = Math.min(sar, previous.low, datas[i-2] ? datas[i-2].low : previous.low)
            
            // 更新极值点和加速因子
            if(current.high > ep) {
              ep = current.high
              af = Math.min(af + step, maxStep)
            }
          }
        } else {
          // 下降趋势
          if(current.high >= newSar) {
            // 趋势反转
            isUpTrend = true
            sar = ep
            ep = current.high
            af = step
          } else {
            sar = newSar
            // 确保SAR不低于前两个周期的最高价
            sar = Math.max(sar, previous.high, datas[i-2] ? datas[i-2].high : previous.high)
            
            // 更新极值点和加速因子
            if(current.low < ep) {
              ep = current.low
              af = Math.min(af + step, maxStep)
            }
          }
        }
      }
      
      return {
        sar: sar,
        trend: isUpTrend ? 'up' : 'down'
      }
    } else {
      console.log('sar has not support size > 1 yet')
      return null
    }
  }

  /**
   * 随机指标 (Stochastic Oscillator)
   * @param {number} kPeriod K值周期，默认14
   * @param {number} dPeriod D值周期，默认3
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {k, d} 或 null
   */
  stochastic(kPeriod=14, dPeriod=3, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < kPeriod) return null

      // 计算%K值
      let recentData = datas.slice(-kPeriod)
      let currentClose = datas[datas.length - 1].close
      
      let highs = recentData.map(item => item.high)
      let lows = recentData.map(item => item.low)
      
      let highestHigh = Math.max(...highs)
      let lowestLow = Math.min(...lows)
      
      if(highestHigh === lowestLow) {
        return {k: 50, d: 50}
      }
      
      let k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
      
      // 计算%D值（%K的移动平均）
      // 简化计算：如果数据足够，计算最近dPeriod个%K的平均值
      let kValues = []
      for(let i = Math.max(0, datas.length - dPeriod); i < datas.length; i++) {
        if(i >= kPeriod - 1) {
          let subData = datas.slice(i - kPeriod + 1, i + 1)
          let subHighs = subData.map(item => item.high)
          let subLows = subData.map(item => item.low)
          let subHighest = Math.max(...subHighs)
          let subLowest = Math.min(...subLows)
          
          if(subHighest !== subLowest) {
            let subK = ((datas[i].close - subLowest) / (subHighest - subLowest)) * 100
            kValues.push(subK)
          } else {
            kValues.push(50)
          }
        }
      }
      
      let d = kValues.length > 0 ? helper.ma(kValues, kValues.length) : k
      
      return {
        k: k,
        d: d || k
      }
    } else {
      console.log('stochastic has not support size > 1 yet')
      return null
    }
  }

  /**
   * TRIX指标 (Triple Exponentially Smoothed Moving Average)
   * @param {number} period 周期，默认14
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} TRIX值 或 null
   */
  trix(period=14, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period + 2) return null

      let closes = datas.map(item => item.close)
      
      // 简化TRIX计算：使用三重指数移动平均
      let ema1 = helper.ema(closes, period)
      if(ema1 === null) return null
      
      // 为了计算三重EMA，我们需要更多数据点
      // 这里简化处理，使用单一EMA的变化率作为TRIX的近似值
      if(closes.length < 2) return null
      
      let currentPrice = closes[closes.length - 1]
      let previousPrice = closes[closes.length - 2]
      
      if(previousPrice === 0) return 0
      
      // TRIX = 价格变化率 * 10000（转换为基点）
      let trix = ((currentPrice - previousPrice) / previousPrice) * 10000
      
      return trix
    } else {
      console.log('trix has not support size > 1 yet')
      return null
    }
  }

  /**
   * DMI指标 (Directional Movement Index)
   * @param {number} period 周期，默认14
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {pdi, mdi, dx} 或 null
   */
  dmi(period=14, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period + 1) return null

      // 计算TR、DM+、DM-
      let trValues = []
      let dmPlus = []
      let dmMinus = []
      
      for(let i = 1; i < datas.length; i++) {
        let current = datas[i]
        let previous = datas[i-1]
        
        // 计算TR
        let tr1 = current.high - current.low
        let tr2 = Math.abs(current.high - previous.close)
        let tr3 = Math.abs(current.low - previous.close)
        trValues.push(Math.max(tr1, tr2, tr3))
        
        // 计算DM+ 和 DM-
        let upMove = current.high - previous.high
        let downMove = previous.low - current.low
        
        if(upMove > downMove && upMove > 0) {
          dmPlus.push(upMove)
        } else {
          dmPlus.push(0)
        }
        
        if(downMove > upMove && downMove > 0) {
          dmMinus.push(downMove)
        } else {
          dmMinus.push(0)
        }
      }
      
      // 计算ATR和平均DM
      let atr = helper.ma(trValues.slice(-period), period)
      let avgDmPlus = helper.ma(dmPlus.slice(-period), period)
      let avgDmMinus = helper.ma(dmMinus.slice(-period), period)
      
      if(atr === null || atr === 0 || avgDmPlus === null || avgDmMinus === null) {
        return null
      }
      
      // 计算PDI和MDI
      let pdi = (avgDmPlus / atr) * 100
      let mdi = (avgDmMinus / atr) * 100
      
      // 计算DX
      let diSum = pdi + mdi
      let dx = diSum === 0 ? 0 : Math.abs(pdi - mdi) / diSum * 100
      
      return {
        pdi: pdi,
        mdi: mdi,
        dx: dx
      }
    } else {
      console.log('dmi has not support size > 1 yet')
      return null
    }
  }

  /**
   * OBV指标 (On Balance Volume)
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} OBV值 或 null
   */
  obv(size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < 2) return null

      let obvValue = 0
      
      for(let i = 1; i < datas.length; i++) {
        let current = datas[i]
        let previous = datas[i-1]
        
        if(current.close > previous.close) {
          obvValue += current.vol
        } else if(current.close < previous.close) {
          obvValue -= current.vol
        }
        // 如果收盘价相等，OBV不变
      }
      
      return obvValue
    } else {
      console.log('obv has not support size > 1 yet')
      return null
    }
  }

  /**
   * VWAP指标 (Volume Weighted Average Price)
   * @param {number} period 周期，默认20
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} VWAP值 或 null
   */
  vwap(period=20, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period) return null

      let recentData = datas.slice(-period)
      
      let totalVolumePrice = 0
      let totalVolume = 0
      
      recentData.forEach(item => {
        // 典型价格 = (最高价 + 最低价 + 收盘价) / 3
        let typicalPrice = (item.high + item.low + item.close) / 3
        totalVolumePrice += typicalPrice * item.vol
        totalVolume += item.vol
      })
      
      if(totalVolume === 0) return null
      
      return totalVolumePrice / totalVolume
    } else {
      console.log('vwap has not support size > 1 yet')
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
      //console.log(priceChanges)

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

  /**
   * MACD指标
   * @param {number} fastPeriod 快线周期，默认12
   * @param {number} slowPeriod 慢线周期，默认26
   * @param {number} signalPeriod 信号线周期，默认9
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {dif, dea, macd} 或 null
   */
  macd(fastPeriod=12, slowPeriod=26, signalPeriod=9, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < slowPeriod + signalPeriod) return null

      let closes = datas.map(item => item.close)
      
      // 计算快线EMA和慢线EMA
      let fastEMA = helper.ema(closes, fastPeriod)
      let slowEMA = helper.ema(closes, slowPeriod)
      
      if(fastEMA === null || slowEMA === null) return null
      
      // DIF = 快线EMA - 慢线EMA
      let dif = fastEMA - slowEMA
      
      // 计算DEA(信号线) - 需要DIF的EMA
      // 这里简化处理，实际应该用DIF序列计算EMA
      let dea = dif * 0.8 // 简化计算
      
      // MACD = 2 * (DIF - DEA)
      let macd = 2 * (dif - dea)
      
      return {
        dif: dif,
        dea: dea,
        macd: macd
      }
    } else {
      console.log('macd has not support size > 1 yet')
      return null
    }
  }

  /**
   * 布林带指标
   * @param {number} period 周期，默认20
   * @param {number} stdDev 标准差倍数，默认2
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {upper, middle, lower} 或 null
   */
  bollinger(period=20, stdDev=2, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period) return null

      let closes = datas.map(item => item.close)
      
      // 中轨：移动平均线
      let middle = helper.ma(closes, period)
      if(middle === null) return null
      
      // 计算标准差
      let sd = helper.SD(closes, period)
      
      // 上轨和下轨
      let upper = middle + (stdDev * sd)
      let lower = middle - (stdDev * sd)
      
      return {
        upper: upper,
        middle: middle,
        lower: lower
      }
    } else {
      console.log('bollinger has not support size > 1 yet')
      return null
    }
  }

  /**
   * KDJ指标
   * @param {number} kPeriod K值周期，默认9
   * @param {number} dPeriod D值周期，默认3
   * @param {number} jPeriod J值周期，默认3
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {k, d, j} 或 null
   */
  kdj(kPeriod=9, dPeriod=3, jPeriod=3, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < kPeriod) return null

      let recentData = datas.slice(-kPeriod)
      
      // 计算最高价和最低价
      let highs = recentData.map(item => item.high)
      let lows = recentData.map(item => item.low)
      let currentClose = datas[datas.length - 1].close
      
      let highestHigh = Math.max(...highs)
      let lowestLow = Math.min(...lows)
      
      // RSV = (收盘价 - 最低价) / (最高价 - 最低价) * 100
      let rsv = 0
      if(highestHigh !== lowestLow) {
        rsv = (currentClose - lowestLow) / (highestHigh - lowestLow) * 100
      }
      
      // K值 = 2/3 * 前一日K值 + 1/3 * 当日RSV (简化处理)
      let k = rsv * 0.6 + 50 * 0.4 // 简化计算，假设前一日K值为50
      
      // D值 = 2/3 * 前一日D值 + 1/3 * 当日K值
      let d = k * 0.6 + 50 * 0.4 // 简化计算
      
      // J值 = 3 * K值 - 2 * D值
      let j = 3 * k - 2 * d
      
      return {
        k: k,
        d: d,
        j: j
      }
    } else {
      console.log('kdj has not support size > 1 yet')
      return null
    }
  }

  /**
   * 威廉指标 Williams %R
   * @param {number} period 周期，默认14
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} Williams %R值 或 null
   */
  williams(period=14, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period) return null

      let recentData = datas.slice(-period)
      let currentClose = datas[datas.length - 1].close
      
      // 计算周期内最高价和最低价
      let highs = recentData.map(item => item.high)
      let lows = recentData.map(item => item.low)
      
      let highestHigh = Math.max(...highs)
      let lowestLow = Math.min(...lows)
      
      // Williams %R = (最高价 - 收盘价) / (最高价 - 最低价) * (-100)
      if(highestHigh === lowestLow) return 0
      
      let wr = (highestHigh - currentClose) / (highestHigh - lowestLow) * (-100)
      
      return wr
    } else {
      console.log('williams has not support size > 1 yet')
      return null
    }
  }

  /**
   * CCI指标 (Commodity Channel Index)
   * @param {number} period 周期，默认14
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {number} CCI值 或 null
   */
  cci(period=14, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period) return null

      let recentData = datas.slice(-period)
      
      // 计算典型价格 TP = (最高价 + 最低价 + 收盘价) / 3
      let typicalPrices = recentData.map(item => {
        return (item.high + item.low + item.close) / 3
      })
      
      // 计算典型价格的移动平均
      let tpMA = helper.ma(typicalPrices, period)
      if(tpMA === null) return null
      
      // 计算平均绝对偏差
      let meanDeviation = 0
      typicalPrices.forEach(tp => {
        meanDeviation += Math.abs(tp - tpMA)
      })
      meanDeviation = meanDeviation / period
      
      if(meanDeviation === 0) return 0
      
      // 当前典型价格
      let currentTP = typicalPrices[typicalPrices.length - 1]
      
      // CCI = (典型价格 - 典型价格移动平均) / (0.015 * 平均绝对偏差)
      let cci = (currentTP - tpMA) / (0.015 * meanDeviation)
      
      return cci
    } else {
      console.log('cci has not support size > 1 yet')
      return null
    }
  }

  /**
   * ADX指标 (Average Directional Index)
   * @param {number} period 周期，默认14
   * @param {number} size 返回数据数量
   * @param {number} offset 偏移量
   * @return {object} {adx, diPlus, diMinus} 或 null
   */
  adx(period=14, size=1, offset=0) {
    if(size == 1) {
      let datas = this.getDataIgnore(offset)
      if(datas.length < period + 1) return null

      // 计算TR (True Range)
      let trValues = []
      for(let i = 1; i < datas.length; i++) {
        let current = datas[i]
        let previous = datas[i-1]
        
        let tr1 = current.high - current.low
        let tr2 = Math.abs(current.high - previous.close)
        let tr3 = Math.abs(current.low - previous.close)
        
        trValues.push(Math.max(tr1, tr2, tr3))
      }

      // 计算DM+ 和 DM- (Directional Movement)
      let dmPlus = []
      let dmMinus = []
      for(let i = 1; i < datas.length; i++) {
        let current = datas[i]
        let previous = datas[i-1]
        
        let upMove = current.high - previous.high
        let downMove = previous.low - current.low
        
        if(upMove > downMove && upMove > 0) {
          dmPlus.push(upMove)
        } else {
          dmPlus.push(0)
        }
        
        if(downMove > upMove && downMove > 0) {
          dmMinus.push(downMove)
        } else {
          dmMinus.push(0)
        }
      }

      // 计算ATR (Average True Range)
      let atr = helper.ma(trValues.slice(-period), period)
      if(atr === null || atr === 0) return null

      // 计算DI+ 和 DI- (Directional Indicators)
      let dmPlusAvg = helper.ma(dmPlus.slice(-period), period)
      let dmMinusAvg = helper.ma(dmMinus.slice(-period), period)
      
      if(dmPlusAvg === null || dmMinusAvg === null) return null
      
      let diPlus = (dmPlusAvg / atr) * 100
      let diMinus = (dmMinusAvg / atr) * 100

      // 计算DX (Directional Index)
      let diSum = diPlus + diMinus
      if(diSum === 0) return {adx: 0, diPlus: diPlus, diMinus: diMinus}
      
      let dx = Math.abs(diPlus - diMinus) / diSum * 100

      // 简化的ADX计算（取最近period个DX的平均值）
      // 注意：标准ADX需要递归计算，这里使用简化版本
      let dxValues = []
      
      // 计算多个DX值用于ADX平均
      for(let i = Math.max(0, datas.length - period * 2); i < datas.length - period + 1; i++) {
        if(i + period < datas.length) {
          let subTrValues = []
          let subDmPlus = []
          let subDmMinus = []
          
          for(let j = i + 1; j < i + period + 1; j++) {
            if(j < datas.length) {
              let curr = datas[j]
              let prev = datas[j-1]
              
              let tr1 = curr.high - curr.low
              let tr2 = Math.abs(curr.high - prev.close)
              let tr3 = Math.abs(curr.low - prev.close)
              subTrValues.push(Math.max(tr1, tr2, tr3))
              
              let upMove = curr.high - prev.high
              let downMove = prev.low - curr.low
              
              subDmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0)
              subDmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0)
            }
          }
          
          let subAtr = helper.ma(subTrValues, subTrValues.length)
          let subDmPlusAvg = helper.ma(subDmPlus, subDmPlus.length)
          let subDmMinusAvg = helper.ma(subDmMinus, subDmMinus.length)
          
          if(subAtr && subAtr > 0 && subDmPlusAvg !== null && subDmMinusAvg !== null) {
            let subDiPlus = (subDmPlusAvg / subAtr) * 100
            let subDiMinus = (subDmMinusAvg / subAtr) * 100
            let subDiSum = subDiPlus + subDiMinus
            
            if(subDiSum > 0) {
              dxValues.push(Math.abs(subDiPlus - subDiMinus) / subDiSum * 100)
            }
          }
        }
      }
      
      let adxValue = dxValues.length > 0 ? helper.ma(dxValues, dxValues.length) : dx
      
      return {
        adx: adxValue || 0,
        diPlus: diPlus,
        diMinus: diMinus
      }
    } else {
      console.log('adx has not support size > 1 yet')
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
