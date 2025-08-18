# Kline K线模块使用文档

## 概述

Kline 是 VTrade 框架中的K线数据处理模块，继承自 Base 基础模块。该模块提供完整的K线数据管理、技术指标计算和数据分析功能，支持多种时间周期和技术分析指标。

## 主要特性

- 支持多种时间周期的K线数据
- 内置常用技术指标计算
- 支持从 Tickers 数据实时生成K线
- 灵活的数据存储和查询机制
- 支持未完成K线的处理选项

## 数据结构

K线数据标准格式：
```javascript
{
  id: 唯一标识,
  high: 最高价,
  low: 最低价, 
  open: 开盘价,
  close: 收盘价,
  vol: 成交量,
  stime: 开始时间戳,
  etime: 结束时间戳
}
```

## 初始化

```javascript
const Kline = require('./core/feed/kline')

const kline = new Kline({
  ktype: 60,                    // K线时间类型(秒)，60=1分钟
  readTickers: false,           // 是否从tickers自动计算
  ignoreIncomplete: false,      // 计算指标时是否忽略未完成的K线
  maxSize: 1000                 // 最大存储数量
})
```

## 核心配置参数

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| ktype | number | K线时间周期(秒) | 60 |
| readTickers | boolean | 是否从tickers自动生成 | false |
| ignoreIncomplete | boolean | 计算指标时忽略未完成K线 | false |
| maxSize | number | 最大存储K线数量 | 继承自Base |

## 常用时间周期

```javascript
// 常用时间周期设置
const timeframes = {
  '1m': 60,        // 1分钟
  '5m': 300,       // 5分钟  
  '15m': 900,      // 15分钟
  '1h': 3600,      // 1小时
  '4h': 14400,     // 4小时
  '1d': 86400      // 1天
}
```

## 数据操作方法

### 添加K线数据

```javascript
// 添加单个K线数据
const result = kline.remember(klineData, timestamp)
// 返回: {code: boolean, event: 'create'|'update'|'wrong'}

// 批量添加数据
klineData.forEach(data => {
  kline.remember(data, data.stime)
})
```

### 查询K线数据

```javascript
// 获取所有K线数据
const allData = kline.getData()

// 获取最近N根K线
const recentData = kline.getLast(10)

// 根据时间查询K线
const klineByTime = kline.getKlineByTime(timestamp, 'etime')

// 获取忽略未完成K线的数据
const completeData = kline.getDataIgnore()
```

## 技术指标计算

### 移动平均线 (MA)

```javascript
// 简单移动平均线
const ma20 = kline.ma(20)        // 20周期MA
const ma50 = kline.ma(50, 1, 0)  // 50周期MA，size=1，offset=0

// 成交量移动平均线
const volMa = kline.volma(20)
```

### 指数移动平均线 (EMA)

```javascript
// 指数移动平均线
const ema12 = kline.ema(12)
const ema26 = kline.ema(26)
```

### 标准差 (SD)

```javascript
// 价格标准差
const sd20 = kline.sd(20)

// 成交量标准差  
const volSd = kline.sdvol(20)

// 标准差百分比
const sdp = kline.sdp(20)
```

### 平均真实波幅 (ATR)

```javascript
// 计算ATR指标
const atr14 = kline.atr(14)  // 14周期ATR
const atr20 = kline.atr(20)  // 20周期ATR
```

### 相对强弱指数 (RSI)

```javascript
// 计算RSI指标
const rsi14 = kline.rsi(14)     // 14周期RSI
const rsi21 = kline.rsi(21, 1, 0) // 21周期RSI，size=1，offset=0
```

## 从Tickers生成K线

```javascript
// 从Tickers对象实时生成K线
kline.transTickers(tickersObject)

// 设置自动从tickers读取
const kline = new Kline({
  ktype: 60,
  readTickers: true  // 启用自动读取
})
```

## 高级功能

### 指标计算参数说明

所有技术指标方法都支持以下参数：
- `step`: 计算周期（必需）
- `size`: 返回数据数量，当前仅支持1
- `offset`: 从末尾偏移的位置

```javascript
// 示例：获取倒数第2根K线的MA20
const ma20Offset = kline.ma(20, 1, 1)
```

### 未完成K线处理

```javascript
// 设置忽略未完成K线
const kline = new Kline({
  ignoreIncomplete: true
})

// 手动获取完整K线数据
const completeData = kline.getDataIgnore()
const incompleteData = kline.getData()
```

### 数据验证和更新

```javascript
// K线数据会自动根据ID或时间戳进行去重
const result = kline.remember(newKlineData, timestamp)

switch(result.event) {
  case 'create':
    console.log('创建新K线')
    break
  case 'update': 
    console.log('更新现有K线')
    break
  case 'wrong':
    console.log('数据错误')
    break
}
```

## 使用示例

### 基础使用

```javascript
const Kline = require('./core/feed/kline')

// 创建1分钟K线
const kline1m = new Kline({
  ktype: 60,
  ignoreIncomplete: true
})

// 添加K线数据
const klineData = {
  id: 1640995200000,
  high: 50000,
  low: 49500,
  open: 49800,
  close: 49900,
  vol: 100.5,
  stime: 1640995200000,
  etime: 1640995260000
}

kline1m.remember(klineData, klineData.stime)
```

### 技术分析示例

```javascript
// 等待足够的数据后计算指标
if(kline1m.getData().length >= 50) {
  // 计算多个移动平均线
  const ma5 = kline1m.ma(5)
  const ma20 = kline1m.ma(20)
  const ma50 = kline1m.ma(50)
  
  // 计算RSI
  const rsi = kline1m.rsi(14)
  
  // 计算ATR
  const atr = kline1m.atr(14)
  
  // 判断趋势
  if(ma5 > ma20 && ma20 > ma50) {
    console.log('多头趋势')
  }
  
  // 判断超买超卖
  if(rsi > 70) {
    console.log('超买区域')
  } else if(rsi < 30) {
    console.log('超卖区域')
  }
}
```

### 多时间周期分析

```javascript
// 创建多个时间周期的K线
const kline1m = new Kline({ktype: 60})    // 1分钟
const kline5m = new Kline({ktype: 300})   // 5分钟
const kline1h = new Kline({ktype: 3600})  // 1小时

// 从1分钟K线生成5分钟K线
function generate5mFrom 1m() {
  const data1m = kline1m.getData()
  // 实现时间周期转换逻辑
}
```

## 注意事项

1. **数据完整性**：确保K线数据的时间戳正确，避免数据错乱
2. **指标计算**：技术指标需要足够的历史数据才能准确计算
3. **内存管理**：设置合理的maxSize避免内存溢出
4. **时间处理**：注意时间戳的单位（毫秒）
5. **未完成K线**：根据策略需求决定是否忽略未完成的K线

## 性能优化建议

1. **合理设置maxSize**：根据策略需求设置合适的历史数据量
2. **批量操作**：尽量批量添加数据而非逐条添加
3. **指标缓存**：对于频繁使用的指标可以考虑缓存结果
4. **内存监控**：定期监控内存使用情况

## 错误处理

```javascript
// 检查指标计算结果
const ma20 = kline.ma(20)
if(ma20 === null) {
  console.log('数据不足，无法计算MA20')
}

// 检查数据添加结果
const result = kline.remember(data, time)
if(!result.code) {
  console.log('数据添加失败')
}
```

通过以上文档，您可以充分利用 Kline 模块进行K线数据管理和技术分析。该模块为量化交易策略提供了强大的数据基础和分析工具。