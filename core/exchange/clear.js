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

  /**
   * 获取未清算订单
   */
  _getUnclearOrders(orders) {
    return orders.filter(order =>
      ( [FILLED, PART_CANCELED].includes(order.status) )
      && !order.cleared
    )
  }

  /**
   * 获取待清算买单
   */
  _getBuyOrders(orders) {
    return this._getUnclearOrders(orders).filter(order => order.side == 'buy')
  }

  /**
   * 获取待清算卖单
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
   * 根据orders队列结对清算盈亏，完成部分标记
   * 忽略已完成清算订单部分
   */
  clear(orders) {
    let fromProfit = 0, profit = 0 // 未减去fee，分别以from,to为计价单位的profit
    let buyFee = 0, sellFee = 0, buyFeeMaker = 0, buyFeeTaker = 0, sellFeeMaker = 0, sellFeeTaker = 0
    let fee = 0, feeMaker = 0, feeTaker = 0 // 以to资产计价
    let ordersBuy = 0, ordersSell = 0

    let buy = this._getBuyOrders(orders)
    let sell = this._getSellOrders(orders)

    let amountClearing = this._getAmountClearing(buy, sell)
    //console.log(amountClearing)
    let amountTmp1 = 0, buyTotal = 0
    for (let i = 0; i < buy.length; i++) {
      if(amountTmp1 >= amountClearing) break
      let order = buy[i]
      let dif = amountClearing - amountTmp1
      let f = 0

      if(dif >= order.amountUnclear) {
        amountTmp1 += order.amountUnclear
        buyTotal += order.amountUnclear*order.price
        f += (order.amountUnclear/order.amountFill)*order.fee*order.price
        order.amountClear += order.amountUnclear
      } else {
        amountTmp1 += dif
        buyTotal += dif*order.price
        f += (dif/order.amountFill)*order.fee*order.price
        order.amountClear += dif
      }
      buyFee += f
      fee += f

      // console.log(f, fee)

      if(order.isMaker) {
        feeMaker += f
      } else {
        feeTaker += f
      }
      ordersBuy++
    }

    let amountTmp2 = 0, sellTotal = 0
    for (let i = 0; i < sell.length; i++) {
      if(amountTmp2 >= amountClearing) break
      let order = sell[i]
      let dif = amountClearing - amountTmp2
      let f = 0
      if(dif >= order.amountUnclear) {
        amountTmp2 += order.amountUnclear
        sellTotal += order.amountUnclear*order.price
        f += (order.amountUnclear/order.amountFill)*order.fee
        order.amountClear += order.amountUnclear
      } else {
        amountTmp2 += dif
        sellTotal += dif*order.price
        f += (dif/order.amountFill)*order.fee
        order.amountClear += dif
      }
      sellFee += f
      fee += f

      // console.log(f, fee)
      if(order.isMaker) {
        feeMaker += f
      } else {
        feeTaker += f
      }
      ordersSell++

    }


    profit = sellTotal - buyTotal

    let res = {
      profit,
      fee,
      feeMaker,
      feeTaker,
      buyFee,
      sellFee,
      ordersBuy,
      ordersSell,
      sellTotal,
      buyTotal
    }

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
    let price, side, amount
    amount = res.buy.amount - res.sell.amount
    if(amount > 0) {
      price = (res.buy.price*res.buy.amount-res.sell.price*res.sell.amount)/amount
      side = 'buy'
    } else {
      price = (res.sell.price*res.sell.amount-res.buy.price*res.buy.amount)/amount
      side = 'sell'
    }
    return {
      side,
      price: price,
      amount: Math.abs(amount),
      buy: res.buy,
      sell: res.sell
    }
  }

}
