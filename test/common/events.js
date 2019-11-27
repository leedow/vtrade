var assert = require('assert')
var events = require('../../core/common/events')

describe('测试消息模块',function(){
  it('订阅消息',function(){
    events.on('test', (data) => {
      assert.equal( 123, data)
    })
  })

  it('发布消息',function(){
    events.emit('test', 123)
  })

  it('发布消息2',function(){
    events.emit('test2', 123)
  })
})
