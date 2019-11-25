let Events = require('./events')

let e = new Events()

module.exports = class Core {
  constructor() {
    this.id = 0
    this.robotId = 0
    this.events = e
  }

  subscribe(eventName, listener) {
    this.events.on(eventName, listener)
  }

}
