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
    this.removeOrders = false // 是否移除完成订单，节约内存
    // super.copyOptions.call(this, options)
  }

  /**
   * 获取订单数量
   */
  getOrdersLength() {
    return this.orders.length
  }

  /**
   * 获取指定状态订单
   */
  getOrdersByStatus(status) {
    return this.orders.filter(order => {
      return order.status == status
    })
  }

  /**
   * 移除已完成订单
   */
  removeFillOrders() {
    if(this.removeOrders) {
      this.orders = this.orders.filter(order => !order.cleared)
    }
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

  /**
   * 获取指定状态订单的最高价买单
   */
  getTopBuyOrder(status = OPEN) {
    let orders = this.orders.filter(order => order.status == status && order.side == 'buy')
    let aim = null, price = 0
    orders.forEach(order => {
      if(order.price >= price) {
        price = order.price
        aim = order
      }
    })
    return aim
  }

  /**
   * 获取指定状态订单的最低价卖单
   */
  getBottomSellOrder(status = OPEN) {
    let orders = this.orders.filter(order => order.status == status && order.side == 'sell')
    let aim = null, price = 99999999999
    orders.forEach(order => {
      if(order.price <= price) {
        price = order.price
        aim = order
      }
    })
    return aim
  }


}
