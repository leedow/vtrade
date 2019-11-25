const EventEmitter = require('events')
class MainEmitter extends EventEmitter {}

/**
 * 事件管理模块
 * 事件分为两级
 * 一级为全局事件，命名方式为 ${name} 通常由机器人订阅
 * 二级事件为局部事件，命名方式为 ${name}-${robotId} 通常由机器人内部对象订阅
 */
module.exports = new MainEmitter()
