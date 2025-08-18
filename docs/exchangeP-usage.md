# ExchangeP 使用文档

## 概述

ExchangeP 是 VTrade 框架中的永续合约交易模块，继承自基础交易所模块 Ex，专门用于处理单交易对的永续合约交易。该模块支持多空双向持仓、杠杆交易、保证金管理等功能。

## 主要特性

- 支持币本位和U本位保证金模式
- 支持单向和双向持仓模式
- 自动计算平均开仓价格和未实现盈亏
- 完整的订单管理和清算系统
- 实时风险控制和保证金检查

## 初始化

```javascript
const ExchangeP = require('./core/exchange/exchangeP')

const exchange = new ExchangeP({
  balance: 'USDT',        // 抵押资产
  lever: 10,              // 交易杠杆
  marginType: 'usd',      // 保证金模式: 'coin' 币本位 | 'usd' U本位
  exchange: 'binance',    // 交易所名称
  pair: 'BTCUSDT',       // 交易对
  product: 'swap'         // 产品类型
})
```

## 核心配置参数

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| balance | string | 抵押资产符号 | '' |
| lever | number | 交易杠杆倍数 | 1 |
| marginType | string | 保证金模式 | 'coin' |
| dualSidePosition | boolean | 是否双向持仓 | 根据marginType自动设置 |

## 主要方法

### 交易方法

#### 基础交易
```javascript
// 买入开多/平空
const result = exchange.buy(price, amount, params, orderType)

// 卖出开空/平多  
const result = exchange.sell(price, amount, params, orderType)
```

#### 明确开平仓操作
```javascript
// 开多仓
exchange.openLong(price, amount, params)

// 平多仓
exchange.closeLong(price, amount, params)

// 开空仓
exchange.openShort(price, amount, params)

// 平空仓
exchange.closeShort(price, amount, params)
```

### 仓位管理

#### 获取仓位信息
```javascript
// 获取净仓位（多仓-空仓）
const position = exchange.getPosition()

// 获取账户余额
const balance = exchange.getBalance()

// 获取未实现盈亏
const unrealizedPnl = exchange.getProfitUnfill('all') // 'all'|'long'|'short'

// 获取实时杠杆
const lever = exchange.getPositionLever()
```

#### 账户报告
```javascript
const report = exchange.report()
// 返回:
// {
//   position: 净仓位,
//   balance: 账户余额,
//   profitUnfill: 未实现盈亏,
//   balanceUnfill: 含未实现盈亏的总权益
// }
```

### 订单管理

#### 清算订单
```javascript
const clearResult = exchange.clearOrders()
// 返回:
// {
//   fee: 总手续费,
//   makerFee: maker手续费,
//   takerFee: taker手续费
// }
```

#### 获取仓位详情
```javascript
const positionInfo = exchange.getPositionInfo()
// 返回详细的持仓信息，包括买卖双向的价格和数量
```

## 保证金模式说明

### 币本位模式 (marginType: 'coin')
- 保证金和盈亏以基础货币计价
- 适用于币本位永续合约
- 盈亏计算：`amount * (1/开仓价 - 1/平仓价)`

### U本位模式 (marginType: 'usd')  
- 保证金和盈亏以稳定币计价
- 自动启用双向持仓模式
- 盈亏计算：`amount * (平仓价 - 开仓价)`

## 持仓模式说明

### 单向持仓模式
- 同一时间只能持有一个方向的仓位
- 反向开仓会自动平仓或减仓
- 适用于简单的交易策略

### 双向持仓模式
- 可以同时持有多空两个方向的仓位
- 需要明确指定开仓或平仓操作
- 提供更灵活的交易策略支持

## 事件订阅

ExchangeP 自动订阅以下事件：
- `ROBOT_TICKER_${eventName}` - 价格行情
- `ROBOT_KLINE_${eventName}` - K线数据
- `ROBOT_TRADE_${eventName}` - 成交数据
- `ROBOT_DEPTH_${eventName}` - 深度数据
- `ROBOT_ORDERS_${eventName}` - 订单更新
- `ROBOT_ACCOUNT_${eventName}` - 账户更新
- `ROBOT_POSITION_${eventName}` - 仓位更新

## 风险控制

### 保证金检查
系统会自动检查每笔订单的保证金需求：
- 开仓时检查可用余额是否充足
- 平仓时检查可平仓数量是否足够
- 支持未实现盈亏计入可用保证金

### 强制平仓
当账户权益不足以维持当前仓位时，系统会触发强制平仓机制。

## 使用示例

```javascript
const ExchangeP = require('./core/exchange/exchangeP')

// 初始化交易所
const exchange = new ExchangeP({
  balance: 'USDT',
  lever: 10,
  marginType: 'usd',
  exchange: 'binance',
  pair: 'BTCUSDT'
})

// 开多仓
const buyOrder = exchange.openLong(50000, 0.1, {
  type: 'limit',
  postOnly: true
})

// 检查仓位
console.log('当前仓位:', exchange.getPosition())
console.log('未实现盈亏:', exchange.getProfitUnfill())

// 平仓
const sellOrder = exchange.closeLong(51000, 0.1)

// 获取账户报告
const report = exchange.report()
console.log('账户报告:', report)
```

## 注意事项

1. **杠杆设置**：杠杆在初始化后不可更改
2. **保证金模式**：不同模式下的盈亏计算方式不同
3. **订单类型**：支持限价单、市价单等多种订单类型
4. **风险管理**：建议设置合理的止损和仓位管理策略
5. **事件处理**：确保正确处理各种订单状态和账户更新事件

## 错误处理

常见错误码：
- `NO_BALANCE`: 保证金不足
- `PARAMS_ERROR`: 参数错误
- 其他交易所相关错误

建议在每次交易操作后检查返回结果的 `code` 字段，并根据 `errCode` 和 `msg` 进行相应的错误处理。