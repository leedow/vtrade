var talib = require('talib');
var Kline = require('./core/feed/kline')
var Tickers = require('./core/feed/tickers')





let kline = new Kline()
let tickers = new Tickers()


kline.filterSame = false
kline.memoryTimeLimit = 99999999999999999
kline.ktype = 60
tickers.filterSame = false
tickers.memoryTimeLimit = 99999999999999999

let now = Date.now()
let n = 0
const nextTime = () => {

now =  now + parseInt(10000*Math.random())
return now
}

const randomPrice = () => {
return  Number ( (1000*Math.random()).toFixed(2)  )
}

const getK = (size=1000) => {
let res = []
while(size--) {
  res.push([randomPrice(), 0,0,0,0,0,0,0,0,0,0, nextTime()])
  n++
}
return res
}

let k = getK()

k.forEach(item => {
tickers.remember(item, item[11])
})

kline.transTickers(tickers)

   //   console.dir( talib.explain('ATR'), {depth:null} )



let go = () => {
	console.log(kline.BOLL(5,2,2,'EMA', 10))
} 

go()



      console.dir( talib.explain('BBANDS'), {depth:null} )
 


console.log(2223345546454)

 
 
 
 