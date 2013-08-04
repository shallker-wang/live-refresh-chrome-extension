Runtime = require('./chrome/runtime')
log = require('./util/debuger').log('Liverefresh')
error = require('./util/debuger').error('Liverefresh')
Connector = require('./lib/connector')

class Liverefresh

  extensionConnected: false
  connected: false

  extensionId: 0

  server:
    protocol: 'ws://'
    host: '127.0.0.1'
    port: 35730

  constructor: ->
    log 'constructor'
    @connectExtension()
    @connector = new Connector "#{@server.protocol}#{@server.host}:#{@server.port}"
    @connector.bind 'connected', =>
      @sendStatus 'connected'
    @connector.bind 'disconnected', =>
      @sendStatus 'disconnected'
    @connector.bind 'error', (error)=>
      @sendError error

  connectExtension: ->
    log 'connectExtension'
    @extensionConnected = true
    @port = Runtime.connect {name: 'liverefresh'}
    @port.onMessage.addListener @onMessage
    @port.onDisconnect.addListener @onExtensionDisconnect

  onExtensionDisconnect: =>
    @extensionConnected = false
    @port = null
    @connectiues()

    connectiues = =>
      return if @extensionConnected
      @connectToExtension()
      window.setTimeout connectiues, 1000

  sendMessage: (message)->
    return error 'not connected' if not @port
    @port.postMessage message

  sendError: (error)->
    @sendMessage {type: 'error', error: error}

  sendStatus: (status)->
    @sendMessage {type: 'status', status: status}

  onMessage: (message)=>
    log 'onMessage', message
    switch message.type
      when 'action' then @onMessageAction message.action

  onMessageAction: (action)=>
    switch action
      when 'connect' then @connector.connect()
      when 'disconnect' then @connector.disconnect()
      when 'destroy' then @destroy()

  destroy: ->
    @port.onMessage.removeListener @onMessage
    @port.onDisconnect.removeListener @onExtensionDisconnect
    @port.disconnect()
    @port = null
    @connector.destroy()

module.exports = Liverefresh
