var assert = require('assert')
var Robot = require('../../core/robot/robot')
var Exchange = require('../../core/exchange/exchangeP')
var events = require('../../core/common/events')

 

describe('测试robot优雅退出移除事件监听', function () {
    it('订阅回调数量', async function () {
        events.removeAllListeners()
        const oneExchangeEvents = 15
        // const oneRobotEvents = 
        const getEventsCount = () => {
            const eventsNames = events.eventNames()
            let totalListeners = 0
            for (const name of eventsNames) {
                totalListeners += events.listeners(name).length
            }
            // console.log(totalListeners)
            return totalListeners
        }
    
        const exchangeName = "test"
        let ex1 = new Exchange({
            name: 'test',
            exchange: exchangeName,
            pair: 'btcusdt',
            from: 'usdt',
            to: 'btc',
            makerFee: -0.01,
            takerFee: 0.01,
            amountAcc: 2,
            priceAcc: 4
        })
           
        let robot = new Robot()
        robot.registerExchange(ex1)

        //await robot.run()
        console.log(getEventsCount())
        assert.deepEqual(getEventsCount(), 15)
        await robot.run()
        assert.deepEqual(getEventsCount(), 16)

        let ex2 = new Exchange({
            name: 'test',
            exchange: exchangeName,
            pair: 'btcusdt',
            from: 'usdt',
            to: 'btc',
            makerFee: -0.01,
            takerFee: 0.01,
            amountAcc: 2,
            priceAcc: 4
        })
    
        let ex3 = new Exchange({
            name: 'test',
            exchange: exchangeName,
            pair: 'btcusdt',
            from: 'usdt',
            to: 'btc',
            makerFee: -0.01,
            takerFee: 0.01,
            amountAcc: 2,
            priceAcc: 4
        })

        let robot2 = new Robot()
        robot2.registerExchange(ex2)
        robot2.registerExchange(ex3)

        assert.deepEqual(getEventsCount(), 16+15+15)

        await robot2.run()
        
        assert.deepEqual(getEventsCount(), 16+15+15+2)
        robot.destroy()
         
        assert.deepEqual(getEventsCount(), 16+15+15+2-1-15)

        robot2.destroy()
        assert.deepEqual(getEventsCount(), 0)


    })

     

     


})