let Core = require('../common/core')
let Queue = require('../feed/queue')
let Group = require('../feed/group')

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

    this.queues = []
    this.groups = []

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
          this._policyCallback(this, ex)
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
    model._eventId = this._id
    this.exchanges.push(model)
  }

  /**
   * 生成一个新的数据队列
   * @param {string} id 队列ID
   */
  createQueue(id) {
    if(!id) return false
    let queue = new Queue({
      id
    })
    this.queues.push(queue)
    return queue
  }

  /**
   * 生成一个新的数据归类器
   * @param {string} id ID
   */
  createGroup(id) {
    if(!id) return false
    let group = new Group({
      id
    })
    this.groups.push(group)
    return group
  }

  /**
   * 删除一个数据队列
   * @param {string} id 队列ID
   */
  removeQueue(id) {
    return this._removeModel(id, 'queues')
  }

  /**
   * 删除一个归类器
   * @param {string} id ID
   */
  removeGroup(id) {
    return this._removeModel(id, 'groups')
  }

  /**
   * 根据ID获取一个数据队列
   * @param {string} id 队列ID
   */
  getQueue(id) {
    return this._getModel(id, 'queues')
  }

  /**
   * 根据ID获取一个归类器
   * @param {string} id ID
   */
  getGroup(id) {
    return this._getModel(id, 'groups')
  }

  /**
   * 获取模块
   * @param {string} type 模块类型 queues|groups
   */
  _getModel(id, type='queues') {
    let index = this[type].findIndex(queue => queue.id == id)
    if(index >= 0) {
      return this[type][index]
    } else {
      return false
    }
  }

  /**
   * 移除模块
   * @param {string} type 模块类型 queues|groups
   */
  _removeModel(id, type='queues') {
    let index = this[type].findIndex(queue => queue.id == id)
    try {
      if(index >= 0) {
        this[type].splice(index, 1)
        return true
      } else {
        return false
      }
    } catch(e) {
      return false
    }
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
