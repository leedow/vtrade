let Ex = require('./ex')
let Tickers = require('../feed/tickers')
let Clear = require('./clear')

/**
 * 单交易对现货
 */
module.exports = class Exchange extends Ex{
  constructor(options) {
    super()

    this.exchange = '' // 交易所名
    this.pair = '' // 交易对名
    this.from = '' // 交易对锚定资产
    this.to = '' // 交易对交易资产
    this.amountAcc = 0
    this.priceAcc = 0
    this.makerFee = 0
    this.takerFee = 0

    this.copyOptions(options)
    this.createAsset(this.from, 0)
    this.createAsset(this.to, 0)

    this.tickers = new Tickers()
    this.clear = new Clear()

    this.subscribeRobotTicker()
    this.subscribeOrders()
  }

  get fullEventName() {
    return `EX_${this.eventName}`
  }

  get eventName() {
    return `${this.exchange}_${this.pair}`
  }

  /**
   * 订阅ticker数据
   */
  subscribeRobotTicker() {
    this.subscribe(`ROBOT_TICKERS_${this.eventName}`, (data) => {
      // console.log(data)
      this.tickers.remember(data)
      this.orders.forEach(order => {
        order.checkStatusByPrice(
          data[2],
          data[4]
        )
      })
      this.publishHeartbeat()
    })
  }

  /**
   * 广播exchange策略执行心跳
   */
  publishHeartbeat() {
    this.publish(this.fullEventName, this)
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

  buy(price, amount) {
    if(!this.checkOrderModel()) return
    if( this.getAsset(this.from).test(amount*price) ) {
      let order = new this.Order({
        exchange: this.exchange,
        pair: this.pair,
        side: 'buy',
        amountAcc: this.amountAcc,
        priceAcc: this.priceAcc,
        makerFee: this.makerFee,
        takerFee: this.takerFee,
        amount: amount,
        price: price
      })
      this.orders.push( order )
      return order.create()

    } else {
      return {
        code: false,
        msg: `Exchange buy failed, test asset failed!`
      }
    }
  }

  sell(price, amount) {
    if(!this.checkOrderModel()) return
    if( this.getAsset(this.to).test(amount) ) {
      let order = new this.Order({
        exchange: this.exchange,
        pair: this.pair,
        side: 'sell',
        amountAcc: this.amountAcc,
        priceAcc: this.priceAcc,
        makerFee: this.makerFee,
        takerFee: this.takerFee,
        amount: amount,
        price: price
      })

      this.orders.push( order )
      return order.create()

    } else {
      return {
        code: false,
        msg: `Exchange sell failed, test asset failed!`
      }
    }
  }


  /**
   * 输出asserts状态信息
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


}
