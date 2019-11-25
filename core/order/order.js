let Core = require('../common/core')

/**
 * 订单基础模型
 */
module.exports = Order extends Core{
  constructor() {
    super()
    
    this.exchange = '' // 所属交易所
    this.orderNumber = '' // 交易所订单号
    this.pair = '' // 交易对

    this.side = '' // buy|sell

    this._price = 0 // 设置价格精度后的价格
    this.priceAcc = 0 // 价格精度小数位数
    this._amount = 0 // 设置精度后的数量
    this.amountAcc = 0 // 数量精度小数位数

    // 订单状态
    this.UNACTIVE = 0
    this.SENDING = 1
    this.OPEN = 2
    this.PARTDONE = 3
    this.DONE = 4
    this.ARTCANCELED = 5
    this.CANCELED = 6
    this.ERROR = 7
    this.LIMIT = 8
    this.status = this.UNACTIVE
  }

  set price(value) {
    this._price = this.formatPrice(value)
  }

  get price() {
    return this._price
  }

  set amount(value) {
    this._amount = this.formatAmount(value)
  }

  get amount() {
    return this._amount
  }

  formatPrice(price) {
    return price.toFixed(this.priceAcc)
  }

  formatAmount(amount) {
    const a = Math.pow(10, this.amountAcc)
    return Math.floor(amount*a)/a
  }

  /**
   * 创建订单
   */
  async create() {
    this.status = this.OPEN
  }

  /**
   * 重发订单
   */
  async resend() {}

  /**
   * 取消订单
   */
  async cancel() {
    this.status = this.CANCELED
  }

  /**
   * 完成订单
   */
  finish() {
    this.status = this.DONE
  }

  /**
   * 订阅ticker价格变化
   */
  subscribeTicker() {
    // super.on(``)
  }

  /**
   * 根据价格完成订单，如果价格穿过仍未取消，订单则判定为成交
   * 用于加快更新订单状态，减少API请求
   */
  checkStatusByPrice(price) {

  }

}
