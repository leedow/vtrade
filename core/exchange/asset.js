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
   * @param {number} 保留小数位
   */
  getAvailable(fix) {
    return this._numberFix(this.balance - this.balanceFrozen, fix)
  }

  /**
   * 根据给定数量获取目标可用数量，如果可用余额小于给定值，则返回可用余额
   * @param {number} balance 期望值
   */
  getAvailableByNumber(balance) {
    return Math.min(
      balance,
      this.getAvailable()
    )
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
      // console.log(this.balanceFrozen, amount)
      this.balanceFrozen -= amount
    }
  }

  /**
   * 减少资产，默认优先减少冻结资产
   * @param {boolean} frozen 是否从冻结资产中扣除
   */
  decrease(amount, frozen=true) {
    this.balance -= amount
    if(frozen) {
      if(amount <= this.balanceFrozen) {
        this.balanceFrozen -= amount
      } else {
        this.balanceFrozen = 0
      }
    }
    if(this.balance < 0) this.balance = 0
  }

  /**
   * 增加资产
   */
  increase(amount) {
    this.balance += amount
  }



}
