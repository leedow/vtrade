let Core = require('../common/core')
let helper = require('../tools/helper')

/**
 * 单交易对清算
 */
module.exports = class Clear extends Core{
  constructor(options) {
    super()
    this.from = ''
    this.to = ''

    this.history = []
    this.copyOptions(options)
  }

  /**
   * 获取未清算订单
   */
  _getUnclearOrders(orders) {
    return orders.filter(order =>
      ( [FILLED, PART_CANCELED, CANCELED].includes(order.status) )
      && !order.cleared
    )
  }

  /**
   * 获取待清算买(多)单
   */
  _getBuyOrders(orders) {
    return this._getUnclearOrders(orders).filter(order => order.side == 'buy')
  }

  /**
   * 获取待清算卖(空)单
   */
  _getSellOrders(orders) {
    return this._getUnclearOrders(orders).filter(order => order.side == 'sell')
  }

  /**
   * 获得待清算的数量，buy,sell待清算小的那个值
   */
  _getAmountClearing(buyOrders, sellOrders) {
    let amountBuyUnclear = helper.sum(buyOrders.map(order => order.amountUnclear))
    let amountSellUnclear = helper.sum(sellOrders.map(order => order.amountUnclear))
    return Math.min(amountBuyUnclear, amountSellUnclear)
  }


  /**
   * 获取一组订单未清算部分的平均价和总数量
   * @return {object} {price:平均价, amount:总数}
   */
  _getPriceAndAmountOfOrders(orders) {
    let price = 0, amount = 0, value = 0
    orders.forEach(order => {
      value += order.priceFill*order.amountUnclear
      amount += order.amountUnclear
    })
    if(amount > 0) price = value/amount
    return {
      price,
      amount,
      maxPrice: orders.length>0?Math.max(...orders.map(order => order.price)):0,
      minPrice: orders.length>0?Math.min(...orders.map(order => order.price)):0
    }
  }


}
