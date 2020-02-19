let Ex = require('../ex')
let Clear = require('./clear')

/**
 * 单交易对现货
 */
module.exports = class Exchange extends Ex{
  constructor(options) {
    super()

    this.from = '' // 交易对锚定资产
    this.to = '' // 交易对交易资产

    this.copyOptions(options)
    this.createAsset(this.from, 0)
    this.createAsset(this.to, 0)

    this.clear = new Clear()

    this.subscribeRobotTicker()
    this.subscribeOrders()
  }

  /**
   * 订阅订单消息
   */
  subscribeOrders() {
    this.subscribe(`ORDER_${this.eventName}`, (order) => {

      switch(order.status) {
        case OPEN: {
          if(order.side == 'buy') {
            this.getAsset(this.from).frozen(order.amount*order.price)
          } else if(order.side == 'sell') {
            this.getAsset(this.to).frozen(order.amount)
          }
          break
        }
        case FILLED: {
          if(order.side == 'buy') {
            this.getAsset(this.from).decrease(order.amountFill*order.price)
            this.getAsset(this.to).increase(order.amountFill-order.fee)
          } else if(order.side == 'sell') {
            this.getAsset(this.from).increase(order.amountFill*order.price-order.fee)
            this.getAsset(this.to).decrease(order.amountFill)
          }
          break
        }
        case CANCELED: {
          if(order.side == 'buy') {
            this.getAsset(this.from).free(order.amount*order.price)
          } else if(order.side == 'sell') {
            this.getAsset(this.to).free(order.amount)
          }
          break
        }
        case PART_FILLED: {
          // ........
          break
        }
        case PART_CANCELED: {
          if(order.side == 'buy') {
            this.getAsset(this.from).decrease(order.amountFill*order.price)
            this.getAsset(this.from).free(order.amountUnfill*order.price)
            this.getAsset(this.to).increase(order.amountFill-order.fee)
          } else if(order.side == 'sell') {
            this.getAsset(this.from).increase(order.amountFill*order.price-order.fee)
            this.getAsset(this.to).decrease(order.amountFill)
            this.getAsset(this.to).free(order.amountUnfill)
          }
          break
        }
        case LIMIT: {
          // ......
          break
        }
        case ERROR: {
          break
        }
      }
    })
  }

  /**
   * 创建买单
   * @param {number} price 价格
   * @param {number} amount 数量
   * @param {object} params 订单额外参数
   */
  buy(price, amount, params) {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      side: 'buy',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      _eventId: this._id,
      robotId: this.robotId,
      postOnly: this._getValue(params, 'postOnly', false),
      params: this._getValue(params, 'params', null)

    })

    if( this.getAsset(this.from).test(order.amount*order.price) ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          msg: 'Exchange buy failed, amount can not be zero'
        }
      }


    } else {
      return {
        code: false,
        msg: `Exchange buy failed, test asset failed!`
      }
    }
  }

  /**
   * 创建卖单
   * @param {number} price 价格
   * @param {number} amount 数量
   * @param {object} params 订单额外参数
   */
  sell(price, amount, params) {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      side: 'sell',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      _eventId: this._id,
      robotId: this.robotId,
      postOnly: this._getValue(params, 'postOnly', false),
      params: this._getValue(params, 'params', null)

    })

    if( this.getAsset(this.to).test(order.amount) ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          msg: 'Exchange sell failed, amount can not be zero'
        }
      }

    } else {
      return {
        code: false,
        msg: `Exchange sell failed, test asset failed!`
      }
    }
  }


  /**
   * 输出asserts状态信息
   * @return {object}
   */
  report() {
    let from = this.getAsset(this.from)
    let to = this.getAsset(this.to)

    return {
      position: this.getPosition(),
      from: {
        balance: from.getBalance(),
        frozen: from.getFrozen()
      },
      to: {
        balance: to.getBalance(),
        frozen: to.getFrozen()
      }
    }
  }

  /**
   * 清算订单
   */
  clearOrders() {
    let res = this.clear.clear(this.orders)
    this.removeFillOrders() // 清除清算完成订单
    return res
  }

  /**
   * 获取仓位，最新价格下to资产占总资产的百分比
   */
  getPosition(fix=4) {
    try {
      let price = this.tickers.getPart('PRICE', 1)[0]
      let to = this.getAsset(this.to).getBalance()*price
      return Number( (to/this.getValue(this.from) ).toFixed(fix) )
    } catch(e) {
      this.error(e)
      return false
    }
  }

  /**
   * 获取仓位总价值
   * @param {string} unit 价值计价单位，from | to
   */
  getValue(unit, type='getBalance') {
    let price = this.tickers.getPart('PRICE', 1)[0]
    let total = 0
    if(unit == this.from) {
      total += this.getAsset(this.from)[type]()
      total += this.getAsset(this.to)[type]()*price
    } else if(unit == this.to) {
      total += this.getAsset(this.from)[type]()/price
      total += this.getAsset(this.to)[type]()
    }
    return total
  }

  /**
   * 获取冻结仓位总价值
   * @param {string} unit 价值计价单位，from | to
   */
  getFrozenValue(unit) {
    return this.getValue(unit, 'getFrozen')
  }

  getPositionInfo() {
    return this.clear.getPositionInfo(this.orders)
  }


}
