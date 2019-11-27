let Ex = require('./ex')

/**
 * 单交易对现货
 */
module.exports = class Exchange extends Ex{
  constructor(options) {
    super()

    this.name = '' // 交易所名
    this.pair = '' // 交易对名
    this.from = '' // 交易对锚定资产
    this.to = '' // 交易对交易资产

    super.copyOptions.call(this, options)

    super.createAsset(this.from, 0)
    super.createAsset(this.to, 0)
  }

  buy() {

  }

  sell() {

  }
}
