let events = require('./events')
let clock = require('./clock')
require('../common/const')

module.exports = class Core {
  constructor() {
    this.id = 0
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

  subscribe(eventName, listener) {
    this.events.on(eventName, listener)
  }

  publish(eventName, data) {
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
