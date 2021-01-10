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
    this.product = '' // 产品名，如spot
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

    this.subTickers = true
    this.subTrades = false
    this.subDepth = false
    this.subOrders = false
    this.subAccount = false
    this.subPosition = false
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
   * 订阅私人orders成交数据
   */
  subscribeRobotOrders() {
    this.subscribeGlobal(`ROBOT_ORDERS_${this.eventName}`, (data) => {
      this._handleOrders(data)
    })
    this.subscribe(`ROBOT_ORDERS_${this.eventName}`, (data) => {
      this._handleOrders(data)
    })
  }

  /**
   * 处理ticker数据
   */
  _handleTickers(data) {
    // 更新内部时间
    this.clock.time = data[TICKER_TIME]

    this.tickers.remember(data)
    this._checkOrderStatus()
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
    this._checkOrderStatus()
    this.publishHeartbeat('DEPTH_UPDATE')
  }

  /**
   * 处理私人orders成交事件
   * @param {array} data [order]
   */
  _handleOrders(data) {
    data.forEach(order => {
      let aimOrder = this.getOrderByNumber(order.orderNumber)
      if(aimOrder) {
        if(order.status == FILLED) {
          aimOrder.fillTime = parseInt(this.tickers.getTime()/1000)
          aimOrder.priceFill = order.priceFill
          aimOrder.finish(Number(order.amountFill), order.fee)
          aimOrder.status = order.status
        } else if(
          (order.status == CANCELED && order.amountFill>0)
          || ( order.status == PART_CANCELED && order.amountFill>0)
        ) {
          aimOrder.fillTime = parseInt(this.tickers.getTime()/1000)
          aimOrder.priceFill = order.priceFill
          aimOrder.finish(Number(order.amountFill), order.fee)
          aimOrder.status = order.status
        } else if(order.status == CANCELED && order.amountFill == 0) {
          aimOrder.cancel()
          aimOrder.status = order.status
        } else if(order.status == OPEN){
          aimOrder.status = order.status
          // TODO
        } else {
          // TODO
        }
      }
    })
  }

  /**
   * 订单成交判定
   */
  _checkOrderStatus() {
    if(!this.autoCheckOrders) return

    let hasTickers = this.tickers.data.length>0
    let hasDepth = this.depth.data.length>0
    let priceBuy = 0, priceSell = 0

    if(hasTickers) {
      let tickers = this.tickers.getLast()
      priceBuy = tickers[TICKER_BID_PRICE]
      priceSell = tickers[TICKER_ASK_PRICE]
    }

    if(
      hasDepth
    ) {
      priceBuy = this.depth.getBidPrice()
      priceSell = this.depth.getAskPrice()
    }
    //console.log('ehcking....')
    this.orders.forEach(order => {
       
      order.checkStatusByPrice(
        priceBuy,
        priceSell
      )
    })

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
    return this.product != '' ?  `${this.exchange}_${this.pair}_${this.product}` : `${this.exchange}_${this.pair}`
  }

  /**
   * 获取订单数量
   */
  getOrdersLength() {
    return this.orders.length
  }

  /**
   * 获取指定订单号的订单
   */
  getOrderByNumber(orderNumber) {
    let res = this.orders.filter(order => order.orderNumber == orderNumber)
    if(res.length > 0) return res[0]
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
