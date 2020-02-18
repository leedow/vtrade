let O = require('./o')

/**
 * 永续合约订单
 */
module.exports = class OrderP extends O {
  constructor(options) {
    super(options)
    this.lever = 1 // 杠杆
    this._direction = '' // long | short
    this.orderType = '' // '' | open | close, 空时默认自动平仓后开仓
    this.marginType = 'coin' // 保证金模式 coin 币本位 | usd本位
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
    if( this.marginType == 'coin' ) {
      return this._fee/this.price
    } else if( this.marginType == 'usd' ) {
      return this._fee*this.price
    }
  }

  /**
   * 获取保证金额，在btcusd_p中单位为btc
   * 若订单为open状态返回开单占用保证金
   * 若订单为成交状态返回实际占用保证金
   */
  get deposit() {
    if( this.marginType == 'coin' ) {
      if(this.amountFill > 0) {
          return (this.amountFill/this.price)/this.lever
      } else {
          return (this.amount/this.price)/this.lever
      }
    } else if( this.marginType == 'usd' ) {
      if(this.amountFill > 0) {
          return (this.amountFill*this.price)/this.lever
      } else {
          return (this.amount*this.price)/this.lever
      }
    }
  }

  finish(amount, fee) {
    if( this.marginType == 'coin' ) {
      super.finish(amount, fee*this.price)
    } else if( this.marginType == 'usd' ) {
      super.finish(amount, fee/this.price)
    }
  }

}
