let Core = require('../common/core')

/**
 * 单资产类
 */
module.exports = class Asset extends Core{
  constructor(options) {
    super()

    super.modelName = 'Asset model'
    this.name = '' // 账户名称
    this.balance = 0 // 资产总数量，包含冻结部分
    this.balanceFrozen = 0 // 资产冻结数量

    this.copyOptions(options)
  }

  _numberFix(number, fix) {
    if(fix) {
      return Number(number.toFixed(fix))
    } else {
      return number
    }
  }

  /**
   * 获得可用资产数量
   */
  getAvailable(fix) {
    return this._numberFix(this.balance - this.balanceFrozen, fix)
  }

  getFrozen(fix) {
    return this._numberFix(this.balanceFrozen, fix)
  }

  getBalance(fix) {
    return this._numberFix(this.balance, fix)
  }

  /**
   * 查询是否有资金可下单
   */
  test(amount) {
    return this.getAvailable() >= amount
  }

  /**
   * 冻结资产，如果冻结数量不足，则返回false
   */
  frozen(amount) {
    amount = Number(amount)
    let left = this.getAvailable()
    if(amount > left) {
      this.error(`frozen(): ${left} is not enough for ${amount}`)
      return false
    } else {
      this.balanceFrozen += amount
      return true
    }
  }

  /**
   * 释放（撤销）冻结资金
   */
  free(amount) {
    amount = Number(amount)
    if(amount >= this.getFrozen() ) {
       this.balanceFrozen = 0
    } else {
      this.balanceFrozen -= amount
    }
  }

  /**
   * 减少资产，默认优先减少冻结资产
   */
  decrease(amount) {
    this.balance -= amount
    if(amount <= this.balanceFrozen) {
      this.balanceFrozen -= amount
    } else {
      this.balanceFrozen = 0
    }
  }

  /**
   * 增加资产
   */
  increase(amount) {
    this.balance += amount
  }

}
