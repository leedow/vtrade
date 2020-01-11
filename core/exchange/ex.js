let Core = require('../common/core')
let Asset = require('./asset')
let Tickers = require('../feed/tickers')

module.exports = class Ex extends Core {
  constructor() {
    super()
    super.modelName = 'Ex model'
    this.name = ''
    this.exchange = '' // 交易所名
    this.pair = '' // 交易对名
    this.amountAcc = 0
    this.priceAcc = 0
    this.makerFee = 0
    this.takerFee = 0
    this.assets = []
    this.orders = []
    this.Order = null
    this.removeOrders = false // 是否移除完成订单，节约内存

    this.tickers = new Tickers()
    // super.copyOptions.call(this, options)
  }

  /**
   * 订阅ticker数据
   */
  subscribeRobotTicker() {
    this.subscribeGlobal(`ROBOT_TICKERS_${this.eventName}`, (data) => {
      this._handleTicker(data)
    })
    this.subscribe(`ROBOT_TICKERS_${this.eventName}`, (data) => {
      this._handleTicker(data)
    })
  }

  /**
   * 处理ticker数据
   */
  _handleTicker(data) {
    this.tickers.remember(data)
    this.orders.forEach(order => {
      order.checkStatusByPrice(
        data[2],
        data[4]
      )
    })
    this.publishHeartbeat()
  }

  /**
   * 广播exchange策略执行心跳
   */
  publishHeartbeat() {
    this.publish(this.fullEventName, this)
  }

  get fullEventName() {
    return `EX_${this.eventName}`
  }

  get eventName() {
    return `${this.exchange}_${this.pair}`
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
   * 获取指定状态买单
   */
  getBuyOrdersByStatus(status) {
    return this.orders.filter(order => {
      return order.status == status
      && (order.side == 'buy')
    })
  }

  /**
   * 获取指定状态卖单
   */
  getSellOrdersByStatus(status) {
    return this.orders.filter(order => {
      return order.status == status
      && (order.side == 'sell')
    })
  }


  /**
   * 移除已完成订单
   */
  removeFillOrders() {
    if(this.removeOrders) {
      this.orders = this.orders.filter(order =>
        !order.cleared
        && ![CANCELED, ERROR, LIMIT].includes(order.status)
      )
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
