log = require('../util/debug').log('Connector')
error = require('../util/debug').error('Connector')
Event = require('event')
StatusReceiver = require('./status-receiver')

class Connector

  connected: false
  socket: null
  server: ''

  protocol: 'LR'
  version: '1.0'
  established: false

  constructor: (@server)->
    Event.attachTo @
    @statusReceiver = new StatusReceiver

  connect: ->
    return if @connected
    @socket = new WebSocket @server
    @socket.onopen = @onOpen
    @socket.onclose = @onClose
    @socket.onerror = @onError
    @socket.onmessage = @onMessage
    @socket

  disconnect: ->
    return unless @connected
    return error 'invalid socket' unless @socket
    if @socket.readyState is @socket.CLOSED
      return error 'socket already closed'
    @socket.close()
    @socket = null

  establishConnection: ->
    @socket.send JSON.stringify
      type: 'handshake'
      protocol: 'LR'
      version: '1.0'

  onOpen: =>
    log 'onOpen', arguments
    @connected = true
    @trigger 'open'
    @establishConnection()

  onClose: =>
    log 'onClose', arguments
    @connected = false
    @trigger 'close'
    @trigger 'disconnected'

  onError: =>
    log 'onError', arguments
    @trigger 'error'

  onMessage: (MessageEvent)=>
    log 'onMessage', arguments
    @trigger 'message'
    message = JSON.parse MessageEvent.data
    switch message.type
      when 'handshake' then @onMessageHandshake message
      when 'status' then @statusReceiver.receive message

  onMessageHandshake: (message)=>
    log 'on handshake protocol', message.protocol
    log 'on handshake version', message.version
    version = parseFloat message.version

    failed = (message)=>
      @disconnect()
      error message

    return failed "protocol does not match '#{message.protocol}'" if message.protocol isnt @protocol
    return failed "old version '#{version}'" if version < 1
    @established = true
    @trigger 'connected'

  getServer: ->
    return 

  destroy: ->
    @disconnect()


module.exports = Connector
