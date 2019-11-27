let Core = require('../common/core')
let Asset = require('./asset')

module.exports = class Ex extends Core {
  constructor() {
    super()
    super.modelName = 'Ex model'
    this.name = ''
    this.assets = []
    this.orders = []
    this.Order = null
  }

  /**
   * 根据名称获取asset
   */
  getAsset(name) {
    return this.assets.find(asset => asset.name === name)
  }

  /**
   * 增加单个资产
   */
  createAsset(name, balance) {
    if(this.getAsset(name)) {
      super.error(`createAsset(): ${name} already exsit!`)
      return
    }
    this.assets.push(new Asset(name, balance))
  }

  /**
   * 注册一个订单模型
   */
  registerOrder(Order) {
    this.Order = Order
  }

}
