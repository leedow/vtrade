# 新增技术指标测试文档

本文件夹包含了为 `kline.js` 新增的技术指标的单元测试。

## 新增指标列表

### 1. MACD (Moving Average Convergence Divergence)
- **文件**: `macd.test.js`
- **方法**: `kline.macd(fastPeriod, slowPeriod, signalPeriod, size, offset)`
- **默认参数**: fastPeriod=12, slowPeriod=26, signalPeriod=9
- **返回值**: `{dif, dea, macd}` 对象

### 2. 布林带 (Bollinger Bands)
- **文件**: `bollinger.test.js`
- **方法**: `kline.bollinger(period, stdDev, size, offset)`
- **默认参数**: period=20, stdDev=2
- **返回值**: `{upper, middle, lower}` 对象

### 3. KDJ 指标
- **文件**: `kdj.test.js`
- **方法**: `kline.kdj(kPeriod, dPeriod, jPeriod, size, offset)`
- **默认参数**: kPeriod=9, dPeriod=3, jPeriod=3
- **返回值**: `{k, d, j}` 对象

### 4. 威廉指标 (Williams %R)
- **文件**: `williams.test.js`
- **方法**: `kline.williams(period, size, offset)`
- **默认参数**: period=14
- **返回值**: 数值 (通常在-100到0之间)

### 5. CCI 指标 (Commodity Channel Index)
- **文件**: `cci.test.js`
- **方法**: `kline.cci(period, size, offset)`
- **默认参数**: period=14
- **返回值**: 数值 (通常在-300到+300之间)

## 测试结构

每个指标的测试文件都包含以下测试用例：

1. **基本功能测试**
   - 返回值结构验证
   - 默认参数测试
   - 自定义参数测试

2. **边界条件测试**
   - 数据不足时的处理
   - 特殊数据情况的处理
   - 参数边界值测试

3. **数值合理性测试**
   - 返回值范围验证
   - 计算逻辑验证
   - 不同参数下的结果对比

4. **错误处理测试**
   - size > 1 时的警告处理
   - 异常情况的处理

## 运行测试

### 运行所有新增指标测试
```bash
# 运行整个测试套件
npm test test/feed/kline/indicators/

# 或者运行入口文件
npm test test/feed/kline/indicators/index.test.js
```

### 运行单个指标测试
```bash
# MACD测试
npm test test/feed/kline/indicators/macd.test.js

# 布林带测试
npm test test/feed/kline/indicators/bollinger.test.js

# KDJ测试
npm test test/feed/kline/indicators/kdj.test.js

# 威廉指标测试
npm test test/feed/kline/indicators/williams.test.js

# CCI测试
npm test test/feed/kline/indicators/cci.test.js
```

## 测试数据

所有测试都使用模拟的K线数据，包含：
- 递增的价格趋势
- 合理的成交量
- 完整的OHLC数据结构

测试数据确保有足够的数据点来计算各种周期的技术指标。

## 注意事项

1. **简化实现**: 当前实现为了快速集成，某些指标（如MACD的DEA计算）采用了简化算法，在生产环境中可能需要更精确的实现。

2. **size参数**: 目前所有新增指标都只支持 `size=1`，当 `size > 1` 时会返回 null 并输出警告。

3. **数据依赖**: 所有指标都依赖 `helper.js` 中的辅助函数，确保这些函数正常工作。

4. **测试覆盖**: 测试覆盖了主要的使用场景和边界条件，但在实际使用中可能需要根据具体需求添加更多测试用例。

## 扩展指南

如需添加新的技术指标：

1. 在 `kline.js` 中添加新的指标方法
2. 在此文件夹中创建对应的测试文件
3. 在 `index.test.js` 中引入新的测试文件
4. 更新此 README 文档