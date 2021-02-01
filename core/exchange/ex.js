let Core = require('../common/core')
let Asset = require('./asset')
let Tickers = require('../feed/tickers')
let Trades = require('../feed/trades')
let Depth = require('../feed/depth')
let Kline = require('../feed/kline')

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
    this.klines = []

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
   * 订阅kline数据
   */
  subscribeRobotKline() {
    this.subscribeGlobal(`ROBOT_KLINE_${this.eventName}`, (data) => {
      this._handleKline(data)
    })
    this.subscribe(`ROBOT_KLINE_${this.eventName}`, (data) => {
      this._handleKline(data)
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
    this._transTickersToKline()
    this.publishHeartbeat('TICKERS_UPDATE')
  }

  /**
   * 处理kline数据
   * @params {object} {id,high,low,open,close,vol,stime,etime, type}
   */
  _handleKline(data) {
    let kline = this.getKline(data.type)

    if(kline) {
      kline.remember(data)
      // 只在第一根kline更新时判断订单成交
      if(data.type == this.klines[0].ktype)
        this._checkOrderStatus()
      this.publishHeartbeat('KLINE_UPDATE')
    } else {
      this.error(`kline type ${data.type} has not created yet!`)
    }
  }

  /*
   * 计算K线数据
   */
  _transTickersToKline() {
    this.klines.forEach(kline => {
      if(kline.readTickers) {
        kline.transTickers(this.tickers)
      }
    })
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
    this.publishHeartbeat('ORDER_UPDATE')

  }

  /**
   * 订单成交判定
   */
  _checkOrderStatus() {
    if(!this.autoCheckOrders) return

    let hasTickers = this.tickers.data.length>0
    let hasDepth = this.depth.data.length>0
    let priceBuy = 0, priceSell = 0

    // if(hasTickers) {
    //   let tickers = this.tickers.getLast()
    //   priceBuy = tickers[TICKER_BID_PRICE]
    //   priceSell = tickers[TICKER_ASK_PRICE]
    // }

    // if(
    //   hasDepth
    // ) {
    //   priceBuy = this.depth.getBidPrice()
    //   priceSell = this.depth.getAskPrice()
    // }
    //console.log('ehcking....')
    this.orders.forEach(order => {
      order.checkStatusByPrice(
        this.getBidPrice(),
        this.getAskPrice()
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
      this.error(`ex.buy(): Order model must be registered!`)
      return false
    } else {
      return true
    }
  }

  /*
   * 获取当前交易对最新价格
   * 按照model优先级： ticker depth 获取
   * 若没有上诉模块数据，返回null
   */
  getPrice() {
    if(this.tickers.haveData()) {
      return this.tickers.getLast()[0]
    }
    if(this.depth.haveData()) {
      return (this.depth.getBidPrice() + this.depth.getAskPrice())/2
    }
    // 如果存在klines则以第一个Kline为准
    if(this.klines.length > 0) {
      if(this.klines[0].haveData()) {
        return this.klines[0].getLast().close
      }
    }
    this.error(`ex.getPrice(): all feed models have no data!`)
    return null
  }

  /*
   * 按 depth  tickers kline 优先级返回买一价
   * 若不存在则返回null
   */
  getBidPrice() {
    if(this.depth.haveData()) {
      return this.depth.getBidPrice()
    }
    if(this.tickers.haveData()) {
      let last = this.tickers.getLast()
      return last[2]>0?last[2]:last[0]
    }
    if(this.klines.length > 0) {
      if(this.klines[0].haveData()) {
        return this.klines[0].getLast().high
      }
    }
    return null
  }

  /*
   * 按 depth  tickers 优先级返回卖一价
   * 若不存在则返回null
   */
  getAskPrice() {
    if(this.depth.haveData()) {
      return this.depth.getAskPrice()
    }
    if(this.tickers.haveData()) {
      let last = this.tickers.getLast()
      return last[4]>0?last[4]:last[0]
    }
    if(this.klines.length > 0) {
      if(this.klines[0].haveData()) {
        return this.klines[0].getLast().low
      }
    }
    return null
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

  /*
   * 创建一个K线收集器
   * @params {number} 单位s的类型，如60位1分钟线
   */
  createKline(type) {
    if(this.klines.filter(item => item.ktype == type).length == 0) {
      let kline  = new Kline({
        id: type, 
        ktype: type
      })
      this.klines.push(kline)
      return kline
    } else {
      return false
    }
  }


  /*
   * 获取指定K线
   */
  getKline(type) {
    return this.klines.find(kline => kline.ktype==type)
  }


}
