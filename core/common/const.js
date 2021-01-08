// 订单状态
global.UNACTIVE = 0
global.SENDING = 1
global.OPEN = 2
global.PART_FILLED = 3
global.FILLED = 4
global.PART_CANCELED = 5
global.CANCELED = 6
global.ERROR = 7
global.LIMIT = 8

// timeInForce下单类型
global.GOOD_TILL_CANCEL = 'GTC' // Good Till Cancel 成交为止
global.POST_ONLY = 'GTX' // Good Till Crossing 无法成为挂单方就撤销


// TICKERS模块
global.TICKER_PRICE = 0
global.TICKER_SIZE = 1
global.TICKER_BID_PRICE = 2
global.TICKER_BID_SIZE = 3
global.TICKER_ASK_PRICE = 4
global.TICKER_ASK_SIZE = 5
global.TICKER_TIME = 11

// TRADES模块
global.TRADE_PRICE = 0
global.TRADE_SIZE = 1
global.TRADE_SIDE = 2
global.TRADE_TIME = 3

// DEPTH模块
global.DEPTH_PRICE = 0
global.DEPTH_SIZE = 1

// 错误代码
global.PARAMS_ERROR = 10001 // 入参错误
global.NO_BALANCE = 10002 // 账户余额不足,无法开单
global.REQUEST_LIMIT = 10003 // 超出访问频率
global.ORDERS_LIMIT = 10004 // 超出下单数量

global.OTHER_ERROR = 99999 // 其他错误


