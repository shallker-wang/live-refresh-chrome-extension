Tabs = require('chrome/tabs')
Runtime = require('chrome/runtime')
BrowserAction = require('chrome/browser-action')
Event = require('lib/event')
Connector = require('connector')
log = require('./util/debug').log('Activator')
error = require('./util/debug').error('Activator')

class Activator

  activated: false

  icon =
    on: '/icons/on/38.png'
    off: '/icons/off/38.png'
    running: '/icons/running/38.png'

  constructor: (@tab)->
    log 'constructor'
    Event.attachTo @
    BrowserAction.on 'click', @onClickIcon
    @activate()

  onClickIcon: (tab)=>
    log 'onClickIcon'
    if @activated then @inactivate() else @activate()

  connect: ->
    if not @connector
      @connector = new Connector @tab
      @connector.bind 'connected', =>
        if @activated then @setIcon icon.running
      @connector.bind 'disconnected', =>
        if @activated then @setIcon icon.on
    @connector.connect()

  disconnect: ->
    @connector.disconnect()

  activate: ->
    log 'activate'
    @activated = true
    @setIcon icon.on
    @connect()
    @trigger 'activate'

  inactivate: ->
    @activated = false
    @setIcon icon.off
    @disconnect()
    @trigger 'inactivate'

  setIcon: (icon)->
    log 'setIcon', icon
    BrowserAction.setIconOfTab icon, @tab.id

  destroy: =>
    BrowserAction.off 'click', @onClickIcon
    @connector.destroy()
    @connector = null
    @trigger 'destroy'

module.exports = Activator
