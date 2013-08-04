log = require('./util/debug').log('Background')
error = require('./util/debug').error('Background')
Tabs = require('chrome/tabs')
BrowserAction = require('chrome/browser-action')
Activator = require('activator')

class Background

  initializedTabs: {}

  constructor: ->
    log 'constructor'
    BrowserAction.on 'click', @onClickIcon
    Tabs.on 'removed', @onTabRemoved

  onClickIcon: (tab)=>
    log 'onClickIcon'
    return if tab.url.match /^chrome:\/\//
    return if @isInitializedTab tab.id
    @initializeTab tab

  onTabRemoved: (tabId, removeInfo)=>
    log 'onTabRemoved', tabId, removeInfo
    return if not @isInitializedTab tabId
    @initializedTabs[tabId].destroy()
    @removeTab tabId

  initializeTab: (tab)->
    activator = new Activator tab
    @addTab tab.id, activator

  addTab: (tabId, activator)->
    return error 'added tab' if @isInitializedTab tabId
    @initializedTabs[tabId] = activator

  removeTab: (tabId)->
    return error 'removed tab' unless @isInitializedTab tabId
    delete @initializedTabs[tabId]

  isInitializedTab: (tabId)->
    @initializedTabs[tabId]

module.exports = Background
