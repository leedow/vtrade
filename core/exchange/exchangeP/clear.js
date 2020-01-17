let C = require('../clear')
let helper = require('../../tools/helper')

/**
 * 永续合约交易对清算
 */
module.exports = class Clear extends C{
  constructor(options) {
    super()
    this.from = ''
    this.to = ''

    this.history = []
    this.copyOptions(options)
  }

  /**
   * 根据orders队列结对清算手续费，完成部分标记
   * 忽略已完成清算订单部分
   */
  clear(orders) {
    let res = {
      fee: 0, // 手续费总数，负数为收入
      makerFee: 0,
      takerFee: 0
    }

    this._getUnclearOrders(orders).forEach(order => {
      res.fee += Number(order.fee)
      if(order.isMaker) {
        res.makerFee += order.fee
      } else {
        res.takerFee += order.fee
      }
      order.amountClear = order.amountFill
    })

    this.history.push(res)
    return res
  }

  /**
   * 获取未清算持仓成本及数量
   * @return {object} {buy: {price:平均成本价，以from为单位, amount:数量，以to为单位}, sell:同buy}
   */
  getBothPositionInfo(orders) {
    let ordersBuy = this._getBuyOrders(orders)
    let ordersSell = this._getSellOrders(orders)

    let buy = this._getPriceAndAmountOfOrders(ordersBuy)
    let sell = this._getPriceAndAmountOfOrders(ordersSell)

    return {
      buy,
      sell
    }
  }

  /**
   * 获取未清算仓位合计信息
   * @return {object} {side:buy|sell, price, amount}
   */
  getPositionInfo(orders) {
    let res = this.getBothPositionInfo(orders)
    let price=0, direction='', amount
    amount = res.buy.amount - res.sell.amount
    amount = Number(amount.toFixed(6))
    if(amount > 0) {
      price = (res.buy.price*res.buy.amount-res.sell.price*res.sell.amount)/amount
      direction = 'long'
    } else if(amount<0){
      price = (res.sell.price*res.sell.amount-res.buy.price*res.buy.amount)/amount
      direction = 'short'
    }

    return {
      direction,
      price: price,
      amount: Math.abs(amount),
      buy: res.buy,
      sell: res.sell
    }

  }


}
