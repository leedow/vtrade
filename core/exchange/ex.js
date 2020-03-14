let Core = require('../common/core')
let Asset = require('./asset')
let Tickers = require('../feed/tickers')
let Trades = require('../feed/trades')
let Depth = require('../feed/depth')

module.exports = class Ex extends Core {
  constructor(options) {
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

    this.autoCheckOrders = true // 是否开启订单状态判定，实盘中可通过该设置项关闭检测避免误差



    this.tickers = new Tickers()
    this.trades = new Trades()
    this.depth = new Depth()

    // this.copyOptions(options)
    // this.subscribeRobotTicker()
    // this.subscribeRobotTrade()

    // super.copyOptions.call(this, options)
  }

  /**
   * 订阅ticker数据
   */
  subscribeRobotTicker() {
    this.subscribeGlobal(`ROBOT_TICKERS_${this.eventName}`, (data) => {
      this._handleTickers(data)
    })
    this.subscribe(`ROBOT_TICKERS_${this.eventName}`, (data) => {
      this._handleTickers(data)
    })
  }

  /**
   * 订阅depth数据
   */
  subscribeRobotDepth() {
    this.subscribeGlobal(`ROBOT_DEPTH_${this.eventName}`, (data) => {
      this._handleDepth(data)
    })
    this.subscribe(`ROBOT_DEPTH_${this.eventName}`, (data) => {
      this._handleDepth(data)
    })
  }

  /**
   * 订阅trades数据
   */
  subscribeRobotTrade() {
    this.subscribeGlobal(`ROBOT_TRADES_${this.eventName}`, (data) => {
      this._handleTrades(data)
    })
    this.subscribe(`ROBOT_TRADES_${this.eventName}`, (data) => {
      this._handleTrades(data)
    })
  }

  /**
   * 处理ticker数据
   */
  _handleTickers(data) {
    this.tickers.remember(data)
    if( this.autoCheckOrders ) {
      this.orders.forEach(order => {
        order.checkStatusByPrice(
          data[2],
          data[4]
        )
      })
    }

    this.publishHeartbeat('TICKERS_UPDATE')
  }

  /**
   * 处理trade数据
   */
  _handleTrades(data) {
    this.trades.remember(data)
    this.publishHeartbeat('TRADES_UPDATE')
  }

  /**
   * 处理depth数据
   */
  _handleDepth(data) {
    this.depth.remember(data)
    this.publishHeartbeat('DEPTH_UPDATE')
  }

  /**
   * 广播exchange策略执行心跳
   */
  publishHeartbeat(eventName) {
    this.publish(this.fullEventName, {
      event: eventName,
      from: this
    })
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
   * 获取订单的总数
   */
  _getAmountOfOrders(orders) {
    let total = 0
    orders.forEach(order => {
      total += order.amount
    })
    return total
  }

  /**
   * 获取指定状态卖（空）单的下单总数
   */
  getSellAmountByStatus(status) {
    return this._getAmountOfOrders(
      this.getSellOrdersByStatus(status)
    )
  }

  /**
   * 获取指定状态买（多）单的下单总数
   */
  getBuyAmountByStatus(status) {
    return this._getAmountOfOrders(
      this.getBuyOrdersByStatus(status)
    )
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
      if(order.price - price >= 0) {
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
      if(order.price - price <= 0) {
        price = order.price
        aim = order
      }
    })
    return aim
  }


}
