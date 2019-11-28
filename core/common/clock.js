/**
 * 内部时钟，在实盘环境中返回真实时间
 * 回测时返回模拟时间
 */
module.exports = {
  test: true,
  time: 0, // 毫秒级别时间戳
  now() {
    if(this.test) {
      return this.time
    } else {
      return Date.now()
    }
  }
}
