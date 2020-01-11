let O = require('./o')

/**
 * 现货订单
 */
module.exports = class Order extends O{
  constructor(options) {
    super(options)
  }

  get fee() {
    if(this.side == 'buy') {
      return this._fee
    } else if(this.side == 'sell') {
      return this._fee*this.price
    }
  }

  finish(amount, fee) {
    if(this.side == 'buy') {
      super.finish(amount, fee)
    } else if(this.side == 'sell') {
      super.finish(amount, fee/this.price)
    }
  }

}
