var talib = require('talib');
var Kline = require('./core/feed/kline')
var Tickers = require('./core/feed/tickers')

let ks = [1,2,3,4,10, 20, 30, 30]
let ks2 = [5, 10, 20, 30, 30]



let real1 = talib.execute({
        name: 'ATR',
        startIdx: ks.length-4,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 1,
        inReal: ks,
        high: ks,
        low: ks,
        open: ks,
        close: ks

    })

console.log(real1)


let real2 = talib.execute({
        name: 'ATR',
        startIdx: ks.length-3,
        endIdx: ks.length-1,
        optInTimePeriod: 2,
        optInMAType: 0,
        inReal: ks,
        high: ks,
        low: ks,
        open: ks,
        close: ks
    })

console.log(real2)