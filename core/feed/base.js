module.exports = class Base {
  constructor() {
    this.name = ''
    this.data = []
    this.memorySize = 100 // 最大记忆长度
  }

  remember(onedata) {
    this.data.push(onedata)
    if(this.data.length > this.memorySize){
      this.data.shift()
    }
  }

  forget() {
    this.data = []
  }

  getData() {
    return this.data
  }

  /**
   * 获取倒数第index个数据
   */
  getLast(offset=1) {
    let i = this.data.length-offset
    if(i<0) i = 0
    return this.data[i]
  }

  /**
   * 获取部分数据
   */
  getPart(data, length, offset=1) {

    let len = data.length
    let endindex = len - offset + 1
    let startindex = endindex - length
    if(endindex < 0) endindex = 0
    if(startindex < 0) startindex = 0

    return data.slice(startindex, endindex)
  }

  log(content) {
    console.log(content)
  }

  error(content) {
    console.error(content)
  }

}
