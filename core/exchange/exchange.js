let Ex = require('./ex')
let Tickers = require('../feed/tickers')

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

    this.subscribeTicker()
    this.subscribeOrders()
  }

  get eventName() {
    return `${this.exchange}_${this.pair}`
  }

  /**
   * 订阅ticker数据
   */
  subscribeTicker() {
    this.subscribe(`TICKERS_${this.eventName}`, (data) => {
      this.tickers.remember(data)
      this.orders.forEach(order => {
        order.checkStatusByPrice(
          data[2],
          data[4]
        )
      })
    })
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
            this.getAsset(this.from).decrease(order.amount*order.price)
            this.getAsset(this.to).increase(order.amount-order.fee)
          } else if(order.side == 'sell') {
            // console.log(order.fee)
            this.getAsset(this.from).increase(order.amount*order.price-order.fee)
            this.getAsset(this.to).decrease(order.amount)
          }
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
      // console.log(order)
      this.orders.push( order )
      this.removeFillOrders()
      return order.create()

    } else {
      return false
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
      //this.removeFillOrders()
      return order.create()

    } else {
      return false
    }
  }
}
