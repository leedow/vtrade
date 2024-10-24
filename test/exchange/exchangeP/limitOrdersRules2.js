let assert = require('assert')
let Exchange = require('../../../core/exchange/exchangeP')
let Order = require('../../../core/order/orderP')
let events = require('../../../core/common/events')
let exchange = null

const LEVER = 2
const total = 100000

describe('Kline事件驱动下：测试exchangeP usdt合约，自定义价格成交规则修改盘口价格',function(){
  const TAKER_FEE = 0.02
  const MAKER_FEE = -0.01

  it('初始化exchange及资产账户',function(){
    exchange = new Exchange({
      exchange: 'test',
      pair: 'btcusd_p',
      balance : 'usdt',
      product: 'usdtFutures',
      makerFee: MAKER_FEE,
      takerFee: TAKER_FEE,
      amountAcc: 2,
      priceAcc: 4,
      lever: LEVER,
      marginType: 'usd',
      dualSidePosition: false,
      limitOrderFillPriceRule: (ex, order) => {
 
        return {
          buyPrice: ex.getBidPrice()*0.5, 
          sellPrice: ex.getAskPrice()*2
        }
      }
    })

    exchange.createKline(60)

    assert.equal( exchange.getAsset('usdt').name, 'usdt')
    assert.equal( exchange.getAsset('long').name, 'long')
    assert.equal( exchange.getAsset('short').name, 'short')

    assert.equal( exchange.getAsset('usdt').balance, 0)
    assert.equal( exchange.getAsset('long').balance, 0)
    assert.equal( exchange.getAsset('short').balance, 0)

  })

  it('设置资产账户余额',function(){
    exchange.getAsset('usdt').balance = total
    assert.equal( exchange.getAsset('usdt').balance, total)
  })


   

  it('4999买入1btc，调价规则*2,成功下单，冻结1*4999usdt',function(){

    exchange.registerOrder(Order)
    let res = exchange.buy(4999, 1, {
      params: {test:1}
    })
    //console.log(res)
    assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 1)
    assert.equal( exchange.getOrdersByStatus(2).length, 1)
    //console.log(exchange.orders[exchange.orders.length-1].params)
    assert.deepEqual( exchange.orders[exchange.orders.length-1].params, {test:1})

  })




  
  it('继续5001买入2btc多单，成功下单，冻结2*5001usdt',function(){
    events.emit('ROBOT_KLINE_test_btcusd_p_usdtFutures', 
        {id:1,high:5555,low:5555,open:2,close:98,vol:1,stime:1,etime:61, type:60}
    )
    exchange.buy(5001, 2)
    //assert.equal( exchange.getAsset('usdt').getAvailable(10), (total-1*4999/LEVER-1*5001/LEVER).toFixed(10) )
    //assert.equal( exchange.getAsset('usdt').getFrozen(10), (1*4999/LEVER+1*5001/LEVER).toFixed(10))
    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })





  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0  )
  })

  it('本应该成交所有多单，但因为手动调价规则（修改buyprice,sellprice）所以没有成交',function(){
    // events.emit('ROBOT_KLINES_test_btcusd_p_usdtFutures', [4999, 1, 4998, 2, 4999, 2, 0,0,0,0,0, 1584020145978])

    events.emit('ROBOT_KLINE_test_btcusd_p_usdtFutures', 
        {id:2,high:4999,low:4998,open:2,close:98,vol:1,stime:1,etime:61, type:60}
    )

    assert.equal( exchange.getOrdersLength(), 2)
    assert.equal( exchange.getOrdersByStatus(2).length, 2)
    
    //assert.equal( exchange.getPosition(), 2)
    //assert.equal( exchange.getOrdersByStatus(2).length, 2)
  })

   
  it('测试仓位',function(){
    assert.equal( exchange.getPosition(), 0 )
  })

 
  
 


})
