let O = require('./o')

/**
 * 永续合约订单
 */
module.exports = class OrderP extends O {
  constructor(options) {
    super(options)
    this.lever = 1 // 杠杆
    this._direction = '' // long | short

    this.copyOptions(options)
  }

  set direction(direction) {
    this._direction = direction
    if(direction == 'long') super.side = 'buy'
    if(direction == 'short') super.side = 'sell'
  }

  get direction() {
    return this._direction
  }

  get fee() {
    return this._fee/this.price
  }

  finish(amount, fee) {
    super.finish(amount, fee*this.price)  
  }

}
