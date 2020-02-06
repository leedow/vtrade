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
  }

  /**
   * 初始化参数
   */
  copyOptions(options) {
    if(typeof options == 'object') {
      for(let key in options) {
        this[key] = options[key]
      }
    }
  }

  /**
   * 从一个对象中获取指定参数，如果不存在则返回res
   */
  getValue(aim, key, res=null) {
    try {
      return aim[key]?aim[key]:res
    } catch(e) {
      console.error(e)
      return res
    }
  }


  /**
   * 订阅
   */
  subscribe(eventName, listener) {
    //console.log(`${eventName}-${this._id}`)
    this.events.on(`${eventName}_${this._id}`, listener)
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
