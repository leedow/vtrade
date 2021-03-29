module.exports = {
  /**
   * 搜索数组最大值，并返回index
   */
  max(data) {
    let max = data[0], index = 0
    for(var i=0; i<data.length; i++) {
      if(data[i] > max){
        max = data[i]
        index = i
      }
    }
    return [max, index]
  },
  min(data) {
    let min = data[0], index = 0
    for(var i=0; i<data.length; i++) {
      if(data[i] <= min) {
          min = data[i]
          index = i
      }
    }
    return [min, index]
  },
  rankingMax(aim, data) {
    const f = data.filter(item => item > aim)
    return f.length + 1
  },
  rankingMin(aim, data) {
    const f = data.filter(item => item < aim)
    return f.length + 1
  },
  avg(data) {
    let avg = 0
    for(var i=0; i<data.length; i++) {
      avg += data[i]/data.length
    }
    return avg
  },
  sum(data) {
    let sum = 0
    data.forEach(item => {
      sum += item
    })
    return sum
  },
  rollSum(data) {
    return data.map((item, index) => {
      let d = data.slice(0, index+1)
      let sum = 0
      d.forEach(item => {
        sum += item
      })
      return sum
    })
  },
  /*
   * 算数平均
   */
  ma(data, n=1, offset=0) {
    if(typeof n == 'undefined') {
      n = data.length
    }

    if(offset+n > data.length) return null
    let d = data.slice(data.length-n-offset, data.length-offset)
    let sum = 0

    d.forEach(item => {
      sum = sum + Number(item)
    })
    return Number( sum/d.length )
  },
  ema(data, n=1, offset=0) {
    if(typeof n == 'undefined') {
      n = data.length
    }

    if(offset+n > data.length) return null
    let d = data
    let sum = 0

    d.forEach((item, index) => {
      sum += item*Math.pow((n-1)/(n+1), d.length-index-1)*2/(n+1)
    })
    return sum
  },
  // 标准差
  SD(data, n) {
    let ma = 0

    if(n) {
      data = data.slice(data.length-n)
    }

    data.forEach(item => {
      ma += item/data.length
    })

    let total = 0
    data.forEach(item => {
      total += (item - ma)*(item - ma)/data.length
    })

    return Math.sqrt(total)
  },
  /**
   * 输入最大最小值，和最小区间，划分数组到指定长度区间的数组中
   */
  arrByStep(min, max, step) {
    let aha = String(step).split('.')
    let fix =0
    if(aha.length>1) {
      fix = aha[1].length
    }

    let total = Math.ceil( (max - min)/step )+1
    let res = []
    let start = 0

    start = step*Math.floor(min/step)


    for (var i = 0; i < total; i++) {
      if(start + i*step >= max) continue
      if(start + (i+1)*step <= min) continue
      res.push([
        Number(Number(start + i*step).toFixed(fix)),
        Number(Number(start + (i+1)*step).toFixed(fix))
      ])
    }

    if(res.length == 0) {
      res.push([
        Number(Number(start).toFixed(fix)),
        Number(Number(start + step).toFixed(fix))
      ])
    }
    return res
  },
  /**
   * 输入一串数组，统计出指定step区间的数量分布
   * @param {array} data 一维数组
   * @param {number} step
   */
  countByArea(data, step) {
    let max = Math.max(...data)
    let min = Math.min(...data)

    let area = this.arrByStep(min, max, step)

    let res = []

    area.forEach(item => {
      res.push(
        data.filter(d => d>= item[0] && (d<=item[1]) ).length
      )
    })

    return {
      x: area,
      y: res
    }
  },
  /**
   * key x
   */
  countByArea2(data, xkey, ykey, step) {
    let arr = data.map(item => item[xkey])
    let max = Math.max(...arr)
    let min = Math.min(...arr)

    let area = this.arrByStep(min, max, step)

    let res = []

    area.forEach(item => {
      let aim = data.filter(d => d[xkey]>= item[0] && (d[xkey]<=item[1]) )

      res.push(
        this.sum(aim.map(a => Number(a[ykey])))
      )
    })

    return {
      x: area,
      y: res
    }
  },
  /**
   * 获取某个值在arr中的位置
   */
  getIndexOfArr(value, arr) {
    try {
      if(value == arr[arr.length-1][1] ) {
        return arr.length - 1
      } else {
          return arr.findIndex( item => value >= item[0] && (value < item[1]) )
      }

    } catch(e) {
      if(value == arr[arr.length-1][1]) {
        return arr.length-1
      } else {
        console.log("get Indexofarrfailed,arr:", arr)
        return false
      }
    }
  },
  // 一组数字，每个数字是前面所有数字最高值的百分比
  maxOfBefore(data, offset = 100) {
    let start = data.length - offset < 0 ? 0: data.length - offset
    let aim = data.slice(start, data.length-1)
    //console.log(aim)
    let count = aim.filter(item => {
      return item <= data[data.length-1]
    })
    return count.length/aim.length
  },
  // 一组数字，每个数字去前面所有数字最小值的百分比
  minOfBefore(data, offset = 100) {
    let start = data.length - offset < 0 ? 0: data.length - offset
    let aim = data.slice(start, data.length-1)
    //console.log(aim)
    let count = aim.filter(item => {
      return item >= data[data.length-1]
    })
    //console.log(count)
    return count.length/aim.length
  },
  // 整个数组每个元素是之后所有最高点的比例
  maxLeft(data, level = 100) {
    let count  = 0
    data.forEach((item, index) => {
      let start = index+1
      let end = index + level >= data.length?data.length:index + level
      let aim = data.slice(start, end)
      if(aim.length > 0 && item >= Math.max(...aim)) count++
    })
    return count/(data.length-1)
  },
  // 整个数组每个元素是之后所有最低点的比例
  minLeft(data, level = 100) {
    let count  = 0
    data.forEach((item, index) => {
      let start = index+1
      let end = index + level > data.length?data.length:index + level
      let aim = data.slice(start, end)
      //console.log(aim, item)
      if(aim.length > 0 && item <= Math.min(...aim)) count++
    })
    return count/(data.length-1)
  },
  /**
   * 获取数字数组的最大回撤
   * @param {array[number]}
   */
  maxRetracement(data) {
    let drawdown = []
    data.forEach((item, index) => {
      const after = data.slice(index, data.length-1)
      const min = Math.min(...after)
      if(min-item < 0) {
        drawdown.push( Math.abs(  (min-item)/(item)  ) )
      }
    })

    return drawdown.length>0?Math.max(...drawdown):0
  },
  /**
   * 获取数字数组相对于起始位置的最大涨幅
   * @param {array[number]}
   */
  maxIncreaseFromBegan(data) {
    let increase = []
    const began = data[0]
    let max = Math.max(...data)
    return max - began
  },
  /*
   * 获取至最后数据的最大跌幅
   * 跌为负数
   */
  maxDecreaseToLast(data) {
    let drawdown = []
    const last = data[data.length-1]
    let max = Math.max(...data)
    return last - max
  },
  /*
   * 后数据减去前数据差额
   */
  sub(data) {
    let res = []
    data.forEach((item, index) => {
      if(index == 0) {
        res.push(item)
      } else {
        res.push( data[index] - data[index-1] )
      }
    })
    return res
  },
  /*
   * 获取时间队列数据相邻数据，上涨下跌或持平的数量
   */
  riseFall(data) {
    let rise = 0 , fall = 0, same = 0
    for (var i = 0; i < data.length; i++) {
      if(i > 0) {
        let dif = data[i] - data[i-1]
        if(dif > 0) rise++
        if(dif < 0) fall++
        if(dif == 0) same++
      }
    }
    return {
      rise, fall, same
    }
  }
}
