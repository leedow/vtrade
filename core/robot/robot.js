let Core = require('../common/core')

/**
 * 交易机器人
 * 支持内置对个交易观察目标，回测以及实盘交易
 */
module.exports = class Robot extends Core{
  constructor() {
    super()

    this.exchanges = [] // 交易所数组
    this._policyCallback = null // 决策回调
    this._prepareCallback = null // 准备回调

    // this.timers = [] // 内置定时器
    // this.pauseTimers = false // 暂停内置定时器执行代码
  }

  get ex() {
    return this.exchanges[0]
  }

  run() {
    if(this._prepareCallback) {
      this._prepareCallback(this)
    }
    this.subscribeExHeartbeat()
  }

  /**
   * 监听exchange心跳，执行策略
   */
  subscribeExHeartbeat() {
    this.exchanges.forEach(ex => {
        this.subscribe(ex.fullEventName, () => {
          this._policyCallback(this)
        })
    })
  }

  /**
   * 为机器人注册一个自定义模块
   */
  registerModel(name, model) {
    if(!this[name]) {
      this[name] = model
      return true
    } else {
      super.error(`registerModel(): ${name} already exsit!`)
      return false
    }
  }

  registerPolicy(model) {
    return this.registerModel('_policyCallback', model)
  }

  registerPrepare(model) {
    return this.registerModel('_prepareCallback', model)
  }

  registerExchange(model) {
    this.exchanges.push(model)
  }

  /**
   * 创建一个定时器
   * @param {string} name 定时器名称
   * @param {number} speed 定时器执行时间间隔，单位ms
   * @param {function} callback 定时器回调
   */
  // createTimer(name, speed = 10000, callback) {
  //   this.timers.push({
  //     name,
  //     timer: setInterval(() => {
  //       if(!this.pauseTimers)
  //         callback(this)
  //     }, speed)
  //   })
  // }


}
