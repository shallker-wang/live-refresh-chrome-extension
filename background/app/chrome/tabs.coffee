class Tab
  id: 0
  index: 0
  windowId: 0
  openerTabId: 0 || null
  highlighted: true
  active: true || false
  pinned: true || false
  url: '' || null
  title: '' || null
  favIconUrl: '' || null
  status: '' || null
  incognito: true || false


class Tabs

  TB = chrome.tabs

  @_callbacks = {}

  ###
  get a tab info
  @onGet (tab)->
  ###
  @get = (tabId, onGet)->
    TB.get tabId, onGet

  ###
  gets the tab that this script call is being made from
  @onGet (tab)->
  ###
  @getCurrent = (onGet)->
    TB.getCurrent onGet

  ###
  get the active tab in current window
  @onGet (tab)->
  ###
  @getActive = (onGet)->
    @query {active: true, currentWindow: true}, (tabs)-> onGet tabs[0]

  ###
  connect to content scripts in a tab
  @return runtime.Port
  ###
  @connect = (tabId)->


  ###
  send a single one-time message to content scripts in a specific tab
  @onResponse (response)->
  ###
  @sendMessage = (tabId, data, onResponse)->
    TB.sendMessage tabId, data, onResponse

  @create = ()->
  @duplicate = ()->

  @query = (match, onMatch)->
    TB.query match, onMatch

  @highlight = ()->
  @update = ()->
  @move = ()->
  @reload = ()->
  @remove = ()->
  @detectLanguage = ()->
  @captureVisibleTab = ()->

  @executeScript = (tabId, detail, callback)->
    TB.executeScript tabId, detail, callback

  @injectScript = (tabId, path, callback)->
    @executeScript tabId, {file: path}, callback

  @injectScriptCode = (tabId, code, callback)->
    @executeScript tabId, {code: code}, callback

  @insertCSS = ()->

  # events
  @onCreated = ()->
  @onUpdated = ()->
  @onMoved = ()->
  @onActivated = ()->
  @onHighlighted = ()->
  @onDetached = ()->
  @onAttached = ()->

  ###
  @callback Function (int: tabId, obj: removeInfo)->
  ###
  @onRemoved = (callback)->
    TB.onRemoved.addListener callback

  @onReplaced = ()->

  @on = (ev, cb)->
    return @on[ev](cb) if typeof @on[ev] is 'function'
    @_callbacks[ev] = cb

  @on.removed = (callback)->
    TB.onRemoved.addListener callback

  @off = (ev, cb)->
    return @off[ev](cb) if typeof @off[ev] is 'function'
    delete @_callbacks[ev]

  @off.removed = (callback)->
    TB.onRemoved.removeListener callback

module.exports = Tabs
