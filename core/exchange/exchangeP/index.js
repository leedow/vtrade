let Ex = require('../ex')
let Clear = require('./clear')

/**
 * 单交易对现货
 */
module.exports = class ExchangeP extends Ex{
  constructor(options) {
    super()

    this.balance = '' // 抵押资产
    //this.from = '' // 交易对锚定资产
    //this.to = '' // 交易对交易资产
    this.lever = 1 // 交易杠杆，初始化后不可更改
    this.marginType = 'coin' // 保证金模式 coin 币本位 | usd本位

    this.dualSidePosition = options.marginType == 'usd'? true:false // 是否双向持仓

    this.copyOptions(options)

    this.createAsset(this.balance, 0)  // 账户资金=账户原始资金+已实现盈亏，计算账户权益资金=账户资金+未实现盈亏
    this.createAsset('long', 0)
    this.createAsset('short', 0)

    this.long = {avgPrice: 0, deposit:0, minPrice:0, maxPrice:0}
    this.short = {avgPrice: 0, deposit:0, minPrice:0, maxPrice:0}

    this.clear = new Clear()

    this.subscribeRobotTicker()
    this.subscribeRobotTrade()
    this.subscribeRobotDepth()
    this.subscribeRobotOrders()
    this.subscribeRobotAccount()
    this.subscribeRobotPosition()

    this.subscribeOrders()
  }

  /**
   * 增加持仓，计算均价，和保证金
   * @param {string} direction 持仓方向
   * @param {number} price
   * @param {number} amount
   * @param {number} deposit 保证金
   */
  increasePosition(direction, price, amount, deposit) {
    //console.log(`change ${direction}, price ${price}, amount ${amount}`)
    let balance = this.getAsset(direction).getBalance()
    this[direction]['avgPrice'] = (this[direction]['avgPrice']*balance + price*amount)/(balance + amount)
    this[direction]['deposit'] += deposit
    // this.getAsset(this.balance).decrease(deposit)
    this.getAsset(direction).increase(amount)
    this.updatePositionPrice(direction, price)

    //console.log(`after change ${this.getAsset(direction).getBalance()}, ${this.getPosition()}`)
  }

  /**
   * 平仓
   * @param {string} direction 平仓方向，比如买入空单时，平多单，为long
   * @param {number} deposit 释放平仓所需订单冻结保证金额度
   */
  decreasePosition(direction, price, amount, deposit) {
    let balance = this.getAsset(direction).getBalance()
    let dep = this[direction]['deposit']
    this[direction]['deposit'] = this[direction]['deposit']*(1-amount/balance)
    this.getAsset(direction).decrease( amount )
    this.getAsset(this.balance).free( dep*(amount/balance) )
    this.getAsset(this.balance).free( deposit )

    if(
      amount.toFixed(this.amountAcc) == balance.toFixed(this.amountAcc)
    ) {
      this[direction]['avgPrice'] = 0
      this[direction]['maxPrice'] = 0
      this[direction]['minPrice'] = 0
    }


    this.updatePositionPrice(direction, price)

  }

  /**
   * 清除某方向仓位
   */
  clearPosition(direction, deposit) {
    this[direction]['avgPrice'] = 0
    this.getAsset(direction).balance = 0
    this.getAsset(this.balance).free( this[direction]['deposit'] )
    this.getAsset(this.balance).free( deposit )
    this[direction]['deposit'] = 0
    this[direction]['maxPrice'] = 0
    this[direction]['minPrice'] = 0
  }

  /**
   * 更新仓位的最低高价
   */
  updatePositionPrice(direction, price) {
    if(price > this[direction].maxPrice) {
      this[direction].maxPrice = price
    }
    if(price < this[direction].minPrice
      || (this[direction].minPrice == 0)
    ) {
      this[direction].minPrice = price
    }
  }

  /**
   * 计算平仓利润，计量单位与amount一致
   * @param {string} direction 平仓方向
   */
  caculateProfit(direction, priceOpen, priceClose, amount) {
    if( this.marginType == 'coin' ) {
      if(direction == 'long') {
        return amount*(1/priceOpen-1/priceClose)
      } else if(direction == 'short') {
        return amount*(1/priceClose-1/priceOpen)
      }
    } else if( this.marginType == 'usd' ) {
      if(direction == 'long') {
        return amount*(priceClose-priceOpen)
      } else if(direction == 'short') {
        return amount*(priceOpen-priceClose)
      }
    }

  }

  /**
   * 更新利润到asset账户
   * @param {string} direction 平仓方向
   * @param {number} priceOpen 开仓价格
   * @param {number} priceClose 平仓价格
   * @param {number} amount 平仓数量
   */
  updateProfit(direction, priceOpen, priceClose, amount) {
    let profit = this.caculateProfit(direction, priceOpen, priceClose, amount)
    if(profit > 0) {
      this.getAsset(this.balance).increase(profit)
    } else if(profit < 0) {
      this.getAsset(this.balance).decrease(-profit, false)
    }
  }

  /**
   * 改变持仓，自动增减空多单，更新可用余额 （包括保证金及利润变化）
   * @param {object} order 订单
   * @return {number} 仓位变化所需保证金 btcusd_p中单位为btc
   */
  updateAssets(order) {

    let long = this.getAsset('long').getBalance()
    let short = this.getAsset('short').getBalance()
    let amount = order.amountFill
    let price = order.price
    let lever = order.lever
    let direction = order.direction
    let deposit = order.deposit

    // console.log(order)

    if(direction == 'long') {
      if(short > 0) {
        if(amount > short) {
          // 逻辑 A
          // 平仓空单short数量，开多amount-short
          this.updateProfit('short', this.short.avgPrice, price, short)
          this.increasePosition('long', price, amount-short, deposit*(amount-short)/amount )
          this.clearPosition('short', deposit*(1-amount+short)/amount )
        } else {
          // 逻辑B
          // 平仓空单amount数量
          this.updateProfit('short', this.short.avgPrice, price, amount)
          this.decreasePosition('short', price, amount, deposit)
        }
      } else {
        // 逻辑C
        // console.log(deposit)
        this.increasePosition('long', price, amount, deposit)
      }
    } else if(direction == 'short') {
      if(long > 0) {
        if(amount > long) {
          // 逻辑D
          // 平仓多单long数量，开空amount-long
          this.updateProfit('long', this.long.avgPrice, price, long)
          this.increasePosition('short', price, amount-long, deposit*(amount-long)/amount)
          this.clearPosition('long', deposit*(1-amount+long)/amount)

        } else {
          // 逻辑E
          // 平仓多单amount数量
          this.updateProfit('long', this.long.avgPrice, price, amount)
          this.decreasePosition('long', price, amount, deposit)

        }
      } else {
        // 逻辑F
        this.increasePosition('short', price, amount, deposit)
      }
    }
    this.updateFee(order.fee)
  }


  /**
   * 单向开仓或平仓，用于可多空同时持仓，用于支持单独开仓和平仓的交易所
   * @param {object} order 订单
   */
  updateAssetsOneDirection(order) {
    let amount = order.amountFill
    let deposit = order.deposit*(order.amountFill/order.amount)
    if(order.direction == 'long') {
      if(order.orderType == 'open') { // 多单开仓
        this.increasePosition('long', order.priceFill, amount, deposit)
      } else if(order.orderType == 'close') { // 空单平仓
        this.updateProfit('short', this.short.avgPrice, order.priceFill, amount)
        this.decreasePosition('short', order.priceFill, amount, deposit)
      }
    } else if(order.direction == 'short') {
      if(order.orderType == 'open') { // 空单开仓
        this.increasePosition('short', order.priceFill, amount, deposit)
      } else if(order.orderType == 'close') { // 多单平仓
        this.updateProfit('long', this.long.avgPrice, order.priceFill, amount)
        this.decreasePosition('long', order.priceFill, amount, deposit)
      }
    }
    this.updateFee(order.fee)

  }

  /**
   * 更新fee收入
   */
  updateFee(fee) {
    if(fee>0) {
      this.getAsset(this.balance).decrease(fee, false)
    } else {
      this.getAsset(this.balance).increase(-fee)
    }
  }


  /**
   * 订阅订单消息
   */
  subscribeOrders() {
    this.subscribe(`ORDER_${this.eventName}`, (order) => {
      switch(order.status) {
        case OPEN: {
          //console.log(order, order.deposit)
          this.getAsset(this.balance).frozen(order.deposit)
          break
        }
        case FILLED: {
          //if(order.orderType == '') this.updateAssets(order)
          //if(['open', 'close'].includes(order.orderType)) this.updateAssetsOneDirection(order)
          //console.log('finish')
          if(this.dualSidePosition) {
            this.updateAssetsOneDirection(order)
          } else {
            this.updateAssets(order)
          }

          break
        }
        case CANCELED: {
          this.getAsset(this.balance).free(order.deposit)
          break
        }
        case PART_FILLED: {
          // ........
          break
        }
        case PART_CANCELED: {
          //if(order.orderType == '') this.updateAssets(order)
          //if(['open', 'close'].includes(order.orderType)) this.updateAssetsOneDirection(order)
          if(this.dualSidePosition) {
            this.updateAssetsOneDirection(order)
          } else {
            this.updateAssets(order)
          }

          break
        }
        case LIMIT: {
          // ......
          break
        }
        case ERROR: {
          break
        }
      }
    })
  }

  /**
   * 创建买单
   * @param {number} price 价格
   * @param {number} amount 数量
   * @param {object} params 订单额外参数
   * @param {object} orderType 下单模式，open开仓，close平仓，''自动平开仓
   */
  buy(price, amount, params, orderType='') {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      product: this.product,
      direction: 'long',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      lever: this.lever,
      _eventId: this._id,
      postOnly: this._getValue(params, 'postOnly', false),
      timeInForce: this._getValue(params, 'timeInForce', 'GTC'),
      reduceOnly: this._getValue(params, 'reduceOnly', false),
      type: this._getValue(params, 'type', 'limit'),
      marginType: this.marginType,
      orderType,
      robotId: this.robotId,
      params: this._getValue(params, 'params', null),
      father: this
    })

    let check = this.checkBalance(order)
    if( check.code ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          errCode: PARAMS_ERROR,
          order,
          msg: 'Exchange buy failed, amount can not be zero'
        }
      }
    } else {
      // console.log(order)
      // console.log(this.getAsset(this.balance).getAvailable())
      return {
        code: false,
        errCode: NO_BALANCE,
        order,
        msg: check.msg
      }
    }
  }

  /**
   * 创建卖单
   * @param {number} price 价格
   * @param {number} amount 数量
   * @param {object} params 订单额外参数
   * @param {object} orderType 下单模式，open开仓，close平仓，''自动平开仓
   */
  sell(price, amount, params, orderType='') {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      product: this.product,
      direction: 'short',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      lever: this.lever,
      _eventId: this._id,
      postOnly: this._getValue(params, 'postOnly', false),
      timeInForce: this._getValue(params, 'timeInForce', 'GTC'),
      reduceOnly: this._getValue(params, 'reduceOnly', false),
      type: this._getValue(params, 'type', 'limit'),
      marginType: this.marginType,
      orderType,
      robotId: this.robotId,
      params: this._getValue(params, 'params', null),
      father: this
    })
    let check = this.checkBalance(order)
    if( check.code ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          errCode: PARAMS_ERROR,
          order,
          msg: 'Exchange sell failed, amount can not be zero'
        }
      }

    } else {
      return {
        code: false,
        errCode: NO_BALANCE,
        order,
        msg: check.msg
      }
    }
  }

  /**
   * 开多
   */
  openLong(price, amount, params) {
    return this.buy(price, amount, params, 'open')
  }

  /**
   * 平多
   */
  closeLong(price, amount, params) {
    return this.sell(price, amount, params, 'close')
  }

  /**
   * 开空
   */
  openShort(price, amount, params) {
    return this.sell(price, amount, params, 'open')
  }

  /**
   * 平空
   */
  closeShort(price, amount, params) {
    return this.buy(price, amount, params, 'close')
  }

  /**
   * 输出asserts状态信息
   * @return {object}
   */
  report() {
    let profitUnfill = this.getProfitUnfill()

    return {
      position: this.getPosition(),
      balance: this.getAsset(this.balance).getBalance(), // 账户真实余额
      profitUnfill: this.getProfitUnfill(), // 未实现盈亏
      balanceUnfill: profitUnfill+this.getAsset(this.balance).getBalance()
    }
  }

  /**
   * 获取未实现盈亏
   * @params {string} directions  all|long|short
   * @return {number} 以抵押物为单位的盈亏值
   */
  getProfitUnfill(directions='all') {
    let profitUnfill = 0, profitUnfillLong = 0, profitUnfillShort = 0
    let price = this.tickers.getLast()[0]

    if(!price ) return 0

    let long = this.getAsset('long').getBalance()
    let short = this.getAsset('short').getBalance()

    if( this.marginType == "coin" ) {
      if(long > 0) {
        profitUnfillLong = (1/this.long.avgPrice-1/price)*long
      }
      if(short > 0) {
        profitUnfillShort = (-1/this.short.avgPrice+1/price)*short
      }
    } else if( this.marginType == "usd" ) {
      if(long > 0) {
        profitUnfillLong = (price - this.long.avgPrice)*long
      }
      if(short > 0) {
        profitUnfillShort = (this.short.avgPrice-price)*short
      }
    }

    if(directions == 'all') {
      return profitUnfillLong + profitUnfillShort
    }

    if(directions == 'long') {
      return profitUnfillLong
    }

    if(directions == 'short') {
      return profitUnfillShort
    }

  }

  /**
   * 测试是否有足够保证金可下单
   * @param {Order} 计划下单
   * @return {Boolean} 是否可下单
   */
  checkBalance(order) {
    // 如果是仅开仓或者平仓

    if(this.dualSidePosition) {
      return this._checkBalanceTwoSides(order)
    } else {
      return this._checkBalanceOneSide(order)
    }

    // if(['open', 'close'].includes(order.orderType)) {
    //   return this._checkBalanceTwoSides(order)
    // }

    // return this._checkBalanceOneSide(order)


  }

  // _checkBalanceReduceOnly(order) {
  //   let short = this.getAsset('short').getBalance()
  //   let long = this.getAsset('long').getBalance()
  // }

  /**
   * 单向合约检查是否可下单
   * @param {Order} 计划下单
   * @return {Boolean} 是否可下单
   */
  _checkBalanceOneSide(order) {
    let balanceCanuse = this.getAsset(this.balance).getAvailable() + this.getProfitUnfill()
    let dif = 0
    if( order.direction == 'long' ) {
      dif = order.amount - this.getAsset('short').getBalance()
    } else if( order.direction == 'short' ) {
      dif = order.amount - this.getAsset('long').getBalance()
    }

    let deposit = order.deposit*(dif/order.amount)

    //console.log(`checkBalanceOneSide info: balance ${balanceCanuse}, deposit ${deposit}`)

    if(dif >= 0) {
      return {
        code: balanceCanuse - deposit > 0,
        msg: `checkBalanceOneSide info: balance ${balanceCanuse}, deposit ${deposit}`
      } 
    } else {
      return {
        code: true,
        msg: `checkBalanceOneSide info: balance ${balanceCanuse}, deposit ${deposit}`
      }
    }
  }

  /**
   * 仅开仓或平仓时检查保证金是否充足
   * 如果可平仓数量小于计划平仓数量，返回false
   * @param {Order} 计划下单
   * @return {Boolean} 是否可下单
   */
  _checkBalanceTwoSides(order) {

    if(order.orderType == 'open') {
      let balanceCanuse = this.getAsset(this.balance).getAvailable()
      //console.log(balanceCanuse)
      //console.log(order.deposit)
      return {
        code: balanceCanuse - order.deposit > 0,
        msg: `checkBalanceTwoSides open info: balance ${balanceCanuse}, deposit ${order.deposit}`
      } 
    } else if(order.orderType == 'close'){
      let short = this.getAsset('short').getBalance()
      let long = this.getAsset('long').getBalance()

      let shortAmount = this._getAmountOfOrders(this.orders.filter(
        order => order.status == OPEN && (order.side == 'sell') && (order.orderType == 'close')
      ))
      let longAmount = this._getAmountOfOrders(this.orders.filter(
        order => order.status == OPEN && (order.side == 'buy') && (order.orderType == 'close')
      ))

      let code
      if(order.direction == 'long') code = ( order.amount <= short - longAmount )
      if(order.direction == 'short') code = ( order.amount <= long - shortAmount )

      return {
        code,
        msg: `checkBalanceTwoSides close info: ${code?'success':'close quanlity cant be more than current position'}`
      }
    } else {
      return {
        code: false,
        msg: 'checkBalanceTwoSides info: wrong orderType'
      }
    }
  }

  /**
   * 清算订单
   * 不同于现货交易，合约交易中清算手续费，不包含交易差价利润
   */
  clearOrders() {
    let res = this.clear.clear(this.orders)
    this.removeFillOrders() // 清除清算完成订单
    return res
  }

  /**
   * 获取合约仓位
   */
  getPosition() {
    let long = this.getAsset('long').getBalance()
    let short = this.getAsset('short').getBalance()
    return long - short
  }
 
  /*
   * 获取保证金总数量
   */
  getBalance() {
    return this.getAsset(this.balance).getBalance()
  }

  /*
   * 获取实时仓位杠杆
   * 如果是双向持仓，返回对冲后的杠杆值
   */
  getPositionLever() {
    let pos = this.getPosition()
    let balance = this.getBalance()

    if(this.marginType == 'coin') {
      //return pos/(balance*)
    }
    else if(this.marginType == 'usd') {

    }
    else {
      this.error(`getPositionLever():unsupported marginType ${this.marginType}`)
      return null
    }
  }

  /**
   * 获取仓位总价值
   * @param {string} unit 价值计价单位，from | to
   */
  getValue(unit, type='getBalance') {

  }

  /**
   * 获取冻结仓位总价值
   * @param {string} unit 价值计价单位，from | to
   */
  getFrozenValue(unit) {
    return this.getValue(unit, 'getFrozen')
  }

  getPositionInfo() {
    return this.clear.getPositionInfo(this.orders)
  }


  /**
   * 订阅私人account数据
   */
  subscribeRobotAccount() {
    this.subscribeGlobal(`ROBOT_ACCOUNT_${this.eventName}`, (data) => {
      this._handleAccount(data)
    })
    this.subscribe(`ROBOT_ACCOUNT_${this.eventName}`, (data) => {
      this._handleAccount(data)
    })
  }

  /**
   * 订阅私人position
   */
  subscribeRobotPosition() {
    this.subscribeGlobal(`ROBOT_POSITION_${this.eventName}`, (data) => {
      this._handlePosition(data)
    })
    this.subscribe(`ROBOT_POSITION_${this.eventName}`, (data) => {
      this._handlePosition(data)
    })
  }


  /**
   * 处理account数据
   * @param {object} data {balance, margin}
   */
  _handleAccount(account) {
      this.getAsset(this.balance).balance = account.balance
      this.getAsset(this.balance).balanceFrozen = account.margin
  }

  /**
   * 处理position数据
   * @param {array} data [postion]
   */
  _handlePosition(positions) {
    this.getAsset('long').balance =  Number(positions.long.amount)
    this.long.avgPrice =positions.long.avgPrice
    this.long.deposit = positions.long.margin

    if(positions.long.amount == 0) {
      this.long.maxPrice = 0
      this.long.minPrice = 0
    }

    this.getAsset('short').balance =  Number(positions.short.amount)
    this.short.avgPrice = positions.short.avgPrice
    this.short.deposit = positions.short.margin

    if(positions.short.amount == 0) {
      this.short.maxPrice = 0
      this.short.minPrice = 0
    }
  }


}
