/**
 * 回测工厂，快速生成回测机器人
 */
let singlePair = require('./singlePair')

module.exports = {
  /**
   * 单个交易对回测
   * @param {object} options {exchange, pair,
   * from, to, fromBalance, toBalance, makerFee, takerFee,
   * amountAcc, priceAcc}
   */
  createSinglePair(options) {
    return singlePair(options)
  }
}
