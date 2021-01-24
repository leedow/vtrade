let Core = require('../common/core')

/**
 * 回测历史数据
 */
module.exports = class Report extends Core{
  constructor(options) {
    super()
    this.copyOptions(options)
    // this.x = [] // 记录时间轴
    this._content = []
    //this._content = {x: []} // 报告数据 {a: [], b: []}
  }


  /*
   * @return {x: [], a: [], b: []}
   */
  get content() {
    return this._format(this._content)
  }

  /*
   * 将[{x,a,b}...]转化为{x:[],a:[]...}
   */
  _format(datas) {
    if(datas.length == 0) return {}

    let res = {
      x: []
    }

    Object.keys(datas[0]['d']).forEach(key => {
      if(!res[key]) {
        res[key] = []
      }
    })    

    for (var i = 0; i < datas.length; i++) {
      let item = datas[i]
      res.x.push(item.x)

      Object.keys(item.d).forEach(key => {
        if(res[key]) {
          res[key].push(item['d'][key])
        }
      })    
    }

    return res
  }

  /**
   * 记录一组数据
   * @param x 时间轴内容
   * @param data {a:value, b:value}
   */
  record(x, data) {
    this._content.push({
      x,
      d: data
    })
    // this.content.x.push(x)
    // //console.log(data)
    // Object.keys(data).forEach(key => {
    //   if(this.content[key]) {
    //     this.content[key].push(data[key])
    //   } else {
    //     this.content[key] = [data[key]]
    //   }
    // })
  }

  /*
   * 初始化历史数据
   * @data {x: [], a: [], b: []}
   */
  restore(data) {
    let keys = Object.keys(data)
    this._content = []

    data.x.forEach((x, index) => {
      let d = {}

      keys.forEach(key => {
        if(key != 'x') d[key] = data[key][index]
      })

      this.record(x, d)
    })
  }

  /*
   * 压缩数据，限定数据长度总量，等比距离取样
   * 返回新数据，不改变旧数据
   * @limit 限定的总记录数
   */ 
  compress() {

  }

  /*
   * 按条件压缩数据长度
   * 返回新数据，不改变旧数据
   * @compare (current, pre) 对比回调函数,返回true保留当前current数据，返回false丢弃当前current数据
   */
  compressBy(compare) {
    let result = []
    this._content.forEach( (item, index) => {
      if(index > 0) {
        if( compare(item, result[result.length-1]) ) {
          result.push(item)
        }
      } else {
        result.push(item)
      }
    })
    return this._format(result)
  }

  result() {
    return this.content
  }

}
