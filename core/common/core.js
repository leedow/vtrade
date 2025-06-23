let events = require('./events')
let clock = require('./clock')
const uuidv1 = require('uuid/v1')
require('../common/const')

module.exports = class Core {
  constructor() {
    this._id = uuidv1()
    this._eventId = 0 // 事件广播目标对象ID，如果为0则全部广播
    this.robotId = 0
    this.events = events
    this.modelName = ''
    this.enableLog = true
    this.enableError = true
    this.clock = clock
    this.events.setMaxListeners(100)
    this.eventsCallbacks = [] // 回调函数的引用，用于安全推出注销事件订阅使用
  }

  /**
   * 初始化参数
   */
  copyOptions(options) {
    if (typeof options == 'object') {
      for (let key in options) {
        this[key] = options[key]
      }
    }
  }

  /**
   * 从一个对象中获取指定参数，如果不存在则返回res
   */
  _getValue(aim, key, res = null) {
    try {
      return aim[key] ? aim[key] : res
    } catch (e) {
      // console.error(e)
      return res
    }
  }

  /**
   * 订阅
   */
  subscribe(eventName, listener) {
    let eventNameId = `${eventName}_${this._id}`
    this.events.on(eventNameId, listener)

    this.eventsCallbacks.push({
      eventName: eventNameId,
      listener
    })
     
  }


  /**
   * 向目标对象广播事件
   */
  publish(eventName, data) {
    this.events.emit(`${eventName}_${this._eventId}`, data)
  }

  /**
   * 订阅世界事件
   */
  subscribeGlobal(eventName, listener) {
     
    this.events.on(eventName, listener)
    this.eventsCallbacks.push({
      eventName,
      listener
    })
     
  }

  /**
   * 向世界广播事件
   */
  publishGlobal(eventName, data) {
    this.events.emit(eventName, data)
  }

  log(content) {
    if (this.enableLog) {
      console.log(content)
    }
  }

  error(content) {
    if (this.enableError) {
      console.error(content)
    }
  }

  /**
  * 注销所有事件订阅
  */
  unsubscribeAll() {
    for (let callback of this.eventsCallbacks) {
      this.events.off(callback.eventName, callback.listener)
    }
    this.eventsCallbacks = []
  }

  /**
   * 查询事件订阅数量
   */
  getEventsCount() {
    const eventsNames = this.events.eventNames()
    let totalListeners = 0
    for (const name of eventsNames) {
      totalListeners += this.events.listeners(name).length
    }
    return totalListeners
  }


}
