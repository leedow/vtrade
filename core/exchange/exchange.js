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
  }

  /**
   * 订阅ticker数据
   */
  subscribeTicker() {
    this.subscribe(`TICKERS_${this.exchange}_${this.pair}`, (data) => {
      this.tickers.remember(data)
    })
  }

  buy(price, amount) {
    if(!this.checkOrderModel()) return
    if( this.getAsset(this.from).frozen(amount*price) ) {
      let order = new this.Order({
        exchange: this.name,
        pair: this.pair,
        side: 'buy',
        amount: amount,
        price: price,
        amountAcc: this.amountAcc,
        priceAcc: this.priceAcc,
        makerFee: this.makerFee,
        takerFee: this.takerFee
      })

      this.orders.push( order )
      this.removeFillOrders()
      return order.create()
    } else {
      return false
    }
  }

  sell(price, amount) {
    if(!this.checkOrderModel()) return
    if( this.getAsset(this.to).frozen(amount) ) {
      let order = new this.Order({
        exchange: this.name,
        pair: this.pair,
        side: 'sell',
        amount: amount,
        price: price,
        amountAcc: this.amountAcc,
        priceAcc: this.priceAcc,
        makerFee: this.makerFee,
        takerFee: this.takerFee
      })

      this.orders.push( order )
      //this.removeFillOrders()
      return order.create()
    } else {
      return false
    }
  }
}
