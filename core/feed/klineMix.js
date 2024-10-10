const helper = require('../tools/helper')
const Kline = require('./kline')

module.exports = class KlineMix{
	constructor(options) {
		this.kline = new Kline({
			id: options.type,
			ktype: options.type
		})

		this.ktype = options.type

		this.basePrice = 1 //基准价格
		this.initTime = 0 // 更新权重的kline时间, ms
		this.startTime = 0
		this.endTime = 0
		this.klines = [] // [{name,kline,rate}]
	}

	/*
	 * @kline {name, kline}
	 */
	addKline(kline) {
		kline.rate = 0
		if(!this.klines.find(item => item.name == kline.name)) {
			this.klines.push(kline)
			return true
		}
		return false
	}

	/*
	 * 更新末尾
	 */
	update() {
		this.init()
		this.kline.forget()
		let step = Math.ceil( (this.endTime - this.startTime)/(this.ktype*1000) ) + 1

		let timeStamp = this.startTime
		for (let i = 0; i < step; i++) {
			let safe = true, prices = []
			this.klines.forEach(item => {
				let k = item.kline.data.find(k => k.d.stime == timeStamp)

				if (k) {
					prices.push( k.d.close*item.rate )
				} else {
					safe = false
				}
			})


			if(!safe) return

			let price = helper.avg(prices)

			this.kline.remember({
				id: timeStamp,
				high: price,
				low: price,
				open: price,
				close: price,
				stime: timeStamp,
				etime: timeStamp+this.ktype*1000
			})

			timeStamp = timeStamp + this.ktype*1000
		}
		 
	}
 

	/*
	 * 初始化权重
	 */
	init() {
		this.initTime = 0
		this.startTime = 0
		this.endTime = 0
		this.klines.forEach(item => {
			let kline = item.kline

			try {
				let first = kline.getFirst()
				if(this.startTime == 0) this.startTime = first.stime
					//console.log(this.startTime)
				 
				let rate = this.basePrice/first.close
				item.rate = rate
				let last = kline.getLast()

				this.initTime = Math.max(this.initTime, first.stime)
				this.startTime = Math.min(this.startTime, first.stime)
				this.endTime = Math.max(this.endTime, last.stime)
			} catch(e) {
				kline.rate = 0
				console.error(e)
			}
		})
	}

}
