let Core = require('../common/core')

/**
 * 回测历史数据
 */
module.exports = class Report extends Core{
  constructor(options) {
    super()
    this.copyOptions(options)
    // this.x = [] // 记录时间轴
    this.content = {x: []} // 报告数据 {a: [], b: []}
  }

  /**
   * 记录一组数据
   * @param x 时间轴内容
   * @param data {a:value, b:value}
   */
  record(x, data) {
    this.content.x.push(x)

    Object.keys(data).forEach(key => {
      if(this.content[key]) {
        this.content[key].push(data[key])
      } else {
        this.content[key] = [data[key]]
      }

    })
  }

  result() {
    return this.content
  }

}
