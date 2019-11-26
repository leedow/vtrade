let Core = require('../common/core')

/**
 * 交易机器人
 * 支持内置对个交易观察目标，回测以及实盘交易
 */
module.exports = Robot extends Core{
  constructor() {
    super()

    this.tickers = null
    this.books = null
    this.trades = null
  }

  this.feeds = {} // 观察标的

  /**
   * 为机器人注册一个模块
   */
  registeModel(name, model) {
    if(!this[name]) {
      this[name] = model
    } else {
      super.error(`registerModel(): ${name} already exsit!`)
    }
  }

  /**
   * 启动准备函数
   */
  prepare() {

  }

  /**
   * 注册事件
   */
  subscribe() {}

  /**
   *
   */

}
