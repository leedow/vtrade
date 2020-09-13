let Core = require('../common/core')

/**
 * 订单基础模型
 */
module.exports = class O extends Core{
  constructor(options) {
    super()

    this.exchange = '' // 所属交易所
    this.orderNumber = '' // 交易所订单号
    this.pair = '' // 交易对
    this.side = '' // buy|sell 买单卖单，多单，空单

    this.makerFee = 0 // maker费率，千分之一设 0.001
    this.takerFee = 0 // taker费率
    this.isMaker = false // 是否是maker单
    this._fee = 0 // 手续费，以amount单位为计价单位

    this._price = 0 // 设置价格精度后的价格
    this.priceAcc = 0 // 价格精度小数位数
    this.priceFill = 0 // 实际成交价格

    this._amount = 0 // 设置精度后的数量
    this.amountAcc = 0 // 数量精度小数位数

    this.amountFill = 0 // 已完成数量
    this.amountClear = 0 // 已清算数量

    this.type = 'limit'

    this.createTime = 0
    this.finishTime = 0

    this.postOnly = false // 仅maker下单

    // GoodTillCancel 一直有效至取消
    // ImmediateOrCancel 立即成交或取消
    // FillOrKill 完全成交或取消
    // PostOnly 被动委托
    this.timeInForce = 'GoodTillCancel' // 下单逻辑，代替postOnly
    this.cancelReason = '' // 取消原因 ‘’|postonly

    this.reduceOnly = false // 是否只减仓，只针对单向持仓的合约有效

    this.params = null // 附带参数

    this.copyOptions(options)
    this.status = UNACTIVE

  }

  set price(value) {
    this._price = this._formatPrice(value)
    this.priceFill = this._price
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

  get amountUnfill() {
    return this._amount - this.amountFill
  }

  get fullEventName() {
    return `ORDER_${this.eventName}`
  }

  get eventName() {
    return `${this.exchange}_${this.pair}`
  }

  /**
   * 是否清算完毕
   */
  get cleared() {
    return this.amountClear >= this.amountFill && (this.amountFill > 0)
  }

  /**
   * 获取待清算数量
   */
  get amountUnclear() {
    return this.amountFill - this.amountClear
  }

  _formatPrice(price) {
    return Number(price.toFixed(this.priceAcc))
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
    if(this.orderNumber == '') {
      this.orderNumber = `${Date.now()}-${(Math.random()*100).toFixed(0)}`
    }

    this.publish(`ORDER_${this.eventName}`, this)
    return {
      code: true,
      order: this,
      msg: 'Order: create order success!'
    }
  }

  /**
   * 重发订单
   */
  resend() {}

  /**
   * 取消订单
   * @param cancelReason 取消原因
   */
  cancel(cancelReason = '') {
    if([OPEN, PART_FILLED].includes(this.status)) {
      if(this.amountFill > 0) {
        this.status = PART_CANCELED
      } else {
        this.status = CANCELED
      }
      this.cancelReason = cancelReason
      this.publish(`ORDER_${this.eventName}`, this)
      return {
        code: true
      }
    } else {
      this.status = ERROR
      return {
        code: false,
        msg: `Order: cancel wrong status order!`
      }
    }

  }

  /**
   * 完成订单
   * @param {number} amount 完成数量
   * @param {number} fee 手续费，可为负数
   */
  finish(amount, fee) {
    if(this.status != OPEN) return
    if(amount) {
      this._finishPart(amount, fee)
    } else {
      this._finishAll()
    }
  }


  /**
   * 完成全部订单
   */
  _finishAll(fee) {
    this.status = FILLED
    this.amountFill = this.amount
    this._setFee(fee)
    this.publish(`ORDER_${this.eventName}`, this)
  }

  /**
   * 完成部分订单
   * @param {number} amount 完成数量
   * @param {number} fee 手续费，可为负数
   */
  _finishPart(amount, fee) {
    if(amount >= this.amount) {
      this._finishAll(fee)
    } else {
      this._update(amount, fee)
      this.status = PART_CANCELED
      this.publish(`ORDER_${this.eventName}`, this)
    }
  }

  /**
   * 更新fee，如果未传入值则根据成交数量和费率自动计算
   * @param {number} fee 手续费，覆盖更新，可为负数
   */
  _setFee(fee) {
    if(fee) {
      this._fee = fee
    } else {
      this._fee = this.isMaker?this.amountFill*this.makerFee:this.amountFill*this.takerFee
      // if(this.side == 'buy') {
      //   this._fee = this.isMaker?this.amountFill*this.makerFee:this.amountFill*this.takerFee
      // } else if(this.side == 'sell') {
      //   this._fee = this.isMaker?this.amountFill*this.makerFee*this.price:this.amountFill*this.takerFee*this.price
      // }
    }
  }

  /**
   * 覆盖形式更新订单成交数量和手续费，但不触发订单变更事件(避免assert重复更新错误)
   * 可用于实盘中订单状态查询
   * @param {number} amount 完成数量
   * @param {number} fee 手续费，可为负数
   */
  _update(amount, fee) {
    this.amountFill = amount||this.amountFill
    this._setFee(fee)
    this.status = PART_FILLED
  }

  /**
   * 根据价格完成订单，如果价格穿过仍未取消，订单则判定为成交
   * 用于加快更新订单状态，减少API请求
   */
  checkStatusByPrice(buyPrice, sellPrice) {
    if(this.status != OPEN) return

    if(this.side == 'buy') {
      if(sellPrice <= this.price) {
        this.postOnly?this._finishByPostOnly():this.finish()
      } else {
        this.isMaker = true
      }
    } else if(this.side == 'sell') {
      if(buyPrice >= this.price) {
        this.postOnly?this._finishByPostOnly():this.finish()
      } else {
        this.isMaker = true
      }
    }
  }

  /**
   * 完成订单时判断postOnly条件，失败时取消订单
   */
  _finishByPostOnly() {
    if( this.postOnly ){
        this.isMaker?this.finish():this.cancel('postOnly')
    } else {
        this.finish()
    }
  }


}
