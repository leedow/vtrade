let Ex = require('../ex')
let Clear = require('./clear')

/**
 * 单交易对现货
 */
module.exports = class ExchangeP extends Ex{
  constructor(options) {
    super()

    this.balance = '' // 抵押资产
    this.from = '' // 交易对锚定资产
    this.to = '' // 交易对交易资产
    this.lever = 1 // 交易杠杆，初始化后不可更改

    this.copyOptions(options)

    this.createAsset(this.balance, 0)
    this.createAsset('long', 0)
    this.createAsset('short', 0)
    this.long = {avgPrice: 0, deposit:0}
    this.short = {avgPrice: 0, deposit:0}

    this.clear = new Clear()
    this.subscribeRobotTicker()
    this.subscribeOrders()
  }

  /**
   * 增加持仓，计算均价，和保证金
   */
  increasePosition(direction, price, amount, deposit) {
    let balance = this.getAsset(direction).getBalance()
    this[direction]['avgPrice'] = (this[direction]['avgPrice']*balance + price*amount)/(balance + amount)
    this[direction]['deposit'] += deposit
    this.getAsset(this.balance).decrease(deposit)
    this.getAsset(direction).increase(amount)
  }

  /**
   * 平仓
   */
  decreasePosition(direction, price, amount) {
    let balance = this.getAsset(direction).getBalance()
    this[direction]['deposit'] = this[direction]['deposit']*(1-amount/balance)
    this.getAsset(this.balance).increase( this[direction]['deposit']*(amount/balance) )
  }

  /**
   * 清除某方向仓位
   */
  clearPosition(direction) {
    this[direction]['avgPrice'] = 0
    this.getAsset(direction).balance = 0
    this.getAsset(this.balance).increase( this[direction]['deposit'] )
    this[direction]['deposit'] = 0
  }

  /**
   * 计算平仓利润，计量单位与amount一致
   * @param {string} direction 平仓方向
   */
  caculateProfit(direction, priceOpen, priceClose, amount) {
    if(direction == 'long') {
      return amount*(1/priceOpen-1/priceClose)
    } else if(direction == 'short') {
      return amount*(1/priceClose-1/priceOpen)
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
      this.getAsset(this.balanace).increase(profit)
    } else if(profit < 0) {
      this.getAsset(this.balanace).decrease(profit)
    }
  }

  /**
   * 改变持仓
   * @param {string} direction long | short
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

    if(direction == 'long') {
      if(short > 0) {
        if(amount > short) {
          // 平仓空单short数量，开多amount-short
          this.increasePosition('long', price, amount-short, deposit*(amount-short)/amount )
          this.clearPosition('short')
          this.updateProfit('short', this.short.avgPrice, price, short)
        } else {
          // 平仓空单amount数量
          this.decreasePosition('short', price, amount)
          this.updateProfit('short', this.short.avgPrice, price, amount)
        }
      } else {
        this.increasePosition('long', price, amount, deposit)
      }
    } else if(direction == 'short') {
      if(long > 0) {
        if(amount > long) {
          // 平仓多单long数量，开空amount-long
          this.increasePosition('short', price, amount-long, deposit*(amount-long)/amount)
          this.clearPosition('long')
          this.updateProfit('long', this.long.avgPrice, price, long)
        } else {
          // 平仓多单amount数量
          this.decreasePosition('long', price, amount)
          this.updateProfit('long', this.long.avgPrice, price, amount)
        }
      } else {
        this.increasePosition('short', price, amount, deposit)
      }
    }

    let fee = order.fee
    if(fee>0) {
      this.getAsset(this.balanace).decrease(fee)
    } else {
      this.getAsset(this.balanace).increase(fee)
    }
  }


  /**
   * 订阅订单消息
   */
  subscribeOrders() {
    this.subscribe(`ORDER_${this.eventName}`, (order) => {
      switch(order.status) {
        case OPEN: {
          this.getAsset(this.balance).frozen(order.deposit)
          break
        }
        case FILLED: {
          this.updateAssets(order)
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
          this.updateAssets(order)
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
   */
  buy(price, amount) {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      direction: 'long',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      lever: this.lever,
      _eventId: this._id
    })

    if( this.getAsset(this.balance).test(order.deposit) ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          msg: 'Exchange buy failed, amount can not be zero'
        }
      }
    } else {
      return {
        code: false,
        msg: `Exchange buy failed, test asset failed!`
      }
    }
  }

  /**
   * 创建卖单
   */
  sell(price, amount) {
    if(!this.checkOrderModel()) return
    let order = new this.Order({
      exchange: this.exchange,
      pair: this.pair,
      direction: 'short',
      amountAcc: this.amountAcc,
      priceAcc: this.priceAcc,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      amount: amount,
      price: price,
      lever: this.lever,
      _eventId: this._id
    })

    if( this.getAsset(this.balance).test(order.deposit) ) {
      if(order.amount > 0) {
        this.orders.push( order )
        return order.create()
      } else {
        return {
          code: false,
          msg: 'Exchange sell failed, amount can not be zero'
        }
      }

    } else {
      return {
        code: false,
        msg: `Exchange sell failed, test asset failed!`
      }
    }
  }


  /**
   * 输出asserts状态信息
   * @return {object}
   */
  report() {
    let from = this.getAsset(this.from)
    let to = this.getAsset(this.to)

    return {
      position: this.getPosition(),
      from: {
        balance: from.getBalance(),
        frozen: from.getFrozen()
      },
      to: {
        balance: to.getBalance(),
        frozen: to.getFrozen()
      }
    }
  }

  /**
   * 清算订单
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
    return long + short
  }

  /**
   * 获取仓位总价值
   * @param {string} unit 价值计价单位，from | to
   */
  getValue(unit, type='getBalance') {
    let price = this.tickers.getPart('PRICE', 1)[0]
    let total = 0
    if(unit == this.from) {
      total += this.getAsset(this.from)[type]()
      total += this.getAsset(this.to)[type]()*price
    } else if(unit == this.to) {
      total += this.getAsset(this.from)[type]()/price
      total += this.getAsset(this.to)[type]()
    }
    return total
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


}
