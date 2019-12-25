const EventEmitter = require('events')
class MainEmitter extends EventEmitter {}

/**
 * 事件管理模块
 */
module.exports = new MainEmitter()
