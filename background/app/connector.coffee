Event = require('lib/event')
Tabs = require('chrome/tabs')
Runtime = require('chrome/runtime')
BrowserAction = require('chrome/browser-action')
log = require('./util/debug').log('Connector')
error = require('./util/debug').error('Connector')

class Connector

  js =
    liverefresh: '/inject/liverefresh.js'
    init: '/inject/init.js'

  beConnected: false
  scriptConnected: false
  connected: false
  port: null

  constructor: (@tab)->
    window.tab = @tab
    Event.attachTo @
    Runtime.on 'connect', @onScriptConnect

  injectScripts: ->
    return error 'missing tab' if not @tab
    Tabs.injectScript @tab.id, js.liverefresh, =>
      log 'injectLiverefreshJS', arguments
      Tabs.injectScript @tab.id, js.init, =>
        log 'injectInitJS', arguments

  sendMessage: (message)->
    return error 'not connected' if not @port
    @port.postMessage message

  sendAction: (action)->
    @sendMessage {type: 'action', action: action}    

  onScriptConnect: (port)=>
    log 'onScriptConnect', port
    @port = port
    @port.onMessage.addListener @onMessage
    @port.onDisconnect.addListener @onScriptDisconnect
    @scriptConnected = true
    @connect() if @beConnected
    @trigger 'script-connect'

  onScriptDisconnect: (PortImpl)=>
    log 'onScriptDisconnect', arguments
    @port = null
    @scriptConnected = false

    if @beConnected then do injectinues = =>
      return if not @beConnected
      return if @scriptConnected
      try
        @injectScripts()
      catch e
        log 'inject scripts failed', e.message
      window.setTimeout injectinues, 1000

    @trigger 'script-disconnect'

  onMessage: (message)=>
    log 'onMessage', message
    switch message.type
      when 'status' then @onMessageStatus message.status
      when 'error' then @onMessageError message.error

  onMessageStatus: (status)=>
    switch status
      when 'connected' then @onConnected()
      when 'disconnected' then @onDisconnected()

  onMessageError: (error)=>

  onConnected: =>
    @connected = true
    @trigger 'connected'

  onDisconnected: =>
    @connected = false
    @trigger 'disconnected'

  connect: ->
    @beConnected = true
    if @scriptConnected
      @sendAction 'connect'
    else
      @injectScripts()

  disconnect: ->
    @beConnected = false
    if @scriptConnected then @sendAction 'disconnect'

  destroy: ->
    @tab = null
    @disconnect()
    Runtime.off 'connect', @onScriptConnect
    try
      @destroyPort()
    catch e
      log 'destroy port failed', e

  destroyPort: ->
    @port.onMessage.removeListener @onMessage
    @port.onDisconnect.removeListener @onScriptDisconnect
    @sendAction 'destroy'
    @port = null


module.exports = Connector
