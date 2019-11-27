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
    // super.copyOptions.call(this, options)

  }

  getOrdersLength() {
    return this.orders.length
  }

  getOrdersByStatus(status) {
    return this.orders.filter(order => {
      return order.status == status
    })
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
      this.error(`createAsset(): ${name} already exsit!`)
      return
    }
    this.assets.push(new Asset({name, balance}))
  }

  /**
   * 注册一个订单模型
   */
  registerOrder(Order) {
    this.Order = Order
  }

  /**
   * 检查order模型是否注册
   */
  checkOrderModel() {
    if(!this.Order) {
      this.error(`buy(): Order model must be registered!`)
      return false
    } else {
      return true
    }
  }



}
