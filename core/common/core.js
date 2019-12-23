let events = require('./events')
let clock = require('./clock')
require('../common/const')

module.exports = class Core {
  constructor() {
    this._id = Date.now()
    this._eventId = 0 // 事件广播目标对象ID，如果为0则全部广播
    this.robotId = 0
    this.events = events
    this.modelName = ''

    this.enableLog = true
    this.enableError = true

    this.clock = clock
  }

  copyOptions(options) {
    if(typeof options == 'object') {
      for(let key in options) {
        this[key] = options[key]
      }
    }
  }

  /**
   * 订阅
   */
  subscribe(eventName, listener) {
    this.events.on(`${eventName}-${this._id}`, listener)
  }

  /**
   * 向目标对象广播事件
   */
  publish(eventName, data) {
    this.events.emit(`${eventName}-${this._eventId}`, data)
  }

  /**
   * 订阅世界事件
   */
  subscribeGlobal(eventName, listener) {
    this.events.on(eventName, listener)
  }

  /**
   * 向世界广播事件
   */
  publishGlobal(eventName, data) {
    this.events.emit(eventName, data)
  }

  log(content) {
    if(this.enableLog) {
      console.log(content)
    }
  }

  error(content) {
    if(this.enableError) {
      console.error(content)
    }
  }

}
