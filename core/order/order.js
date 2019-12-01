let Core = require('../common/core')
/**
 * 订单基础模型
 */
module.exports = class Order extends Core{
  constructor(options) {
    super()

    this.exchange = '' // 所属交易所
    this.orderNumber = '' // 交易所订单号
    this.pair = '' // 交易对
    this.side = '' // buy|sell 买单卖单，多单，空单

    this.makerFee = 0 // maker费率，千分之一设 0.001
    this.takerFee = 0 // taker费率
    this.isMaker = false // 是否是maker单
    this.amountFill = 0 // 已完成数量
    this.fee = 0 // 手续费

    this._price = 0 // 设置价格精度后的价格
    this.priceAcc = 0 // 价格精度小数位数
    this._amount = 0 // 设置精度后的数量
    this.amountAcc = 0 // 数量精度小数位数

    this.copyOptions(options)

    // 订单状态
    // this.UNACTIVE = 0
    // this.SENDING = 1
    // this.OPEN = 2
    // this.PARTDONE = 3
    // this.DONE = 4
    // this.ARTCANCELED = 5
    // this.CANCELED = 6
    // this.ERROR = 7
    // this.LIMIT = 8
    this.status = UNACTIVE
  }

  set price(value) {
    this._price = this._formatPrice(value)
  }

  get price() {
    return this._price
  }

  set amount(value) {
    this._amount = this._formatAmount(value)
  }

  get amount() {
    return this._amount
  }

  get fullEventName() {
    return `ORDER_${this.eventName}`
  }

  get eventName() {
    return `${this.exchange}_${this.pair}`
  }

  _formatPrice(price) {
    return price.toFixed(this.priceAcc)
  }

  _formatAmount(amount) {
    const a = Math.pow(10, this.amountAcc)
    return Math.floor(amount*a)/a
  }

  /**
   * 创建订单
   */
  create() {
    this.status = OPEN
    this.publish(`ORDER_${this.eventName}`, this)
    return true
  }

  /**
   * 重发订单
   */
  async resend() {}

  /**
   * 取消订单
   */
  async cancel() {
    this.status = CANCELED
    this.publish(`ORDER_${this.eventName}`, this)
  }

  /**
   * 完成订单
   */
  finish() {
    this.status = FILLED
    this.amountFill = this.amount

    if(this.side == 'buy') {
      this.fee = this.isMaker?this.amount*this.makerFee:this.amount*this.takerFee
    } else if(this.side == 'sell') {
      this.fee = this.isMaker?this.amount*this.makerFee*this.price:this.amount*this.takerFee*this.price
    }

    this.publish(`ORDER_${this.eventName}`, this)
  }

  /**
   * 订阅ticker价格变化
   */
  subscribeTicker() {
    this.subscribe(`TICKERS_${this.exchange}`,(ticker) => {
       this.checkStatusByPrice(
         ticker.getPart('BUY_PRICE', 1),
         ticker.getPart('SELL_PRICE', 1)
       )
    })
  }



  /**
   * 根据价格完成订单，如果价格穿过仍未取消，订单则判定为成交
   * 用于加快更新订单状态，减少API请求
   */
  checkStatusByPrice(buyPrice, sellPrice) {
    if(this.status != OPEN) return

    if(this.side == 'buy') {
      if(sellPrice <= this.price) {
        this.finish()
      } else {
        this.isMaker = true
      }
    } else if(this.side == 'sell') {
      if(buyPrice >= this.price) {
        this.finish()
      } else {
        this.isMaker = true
      }
    }
  }

}
