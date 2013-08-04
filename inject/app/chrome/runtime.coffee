class Runtime

  RT = chrome.runtime

  @_callbacks = {}

  @on = (ev, cb)->
    return @on[ev](cb) if typeof @on[ev] is 'function'
    @_callbacks[ev] = cb

  ###
  listen message from extension
  @onMessage (message, sender, res)->
  ###
  @on.message = (listener)->
    RT.onMessage.addListener listener

  @on.connect = (listener)->
    RT.onConnect.addListener listener

  @off = (ev, cb)->
    return @off[ev](cb) if typeof @off[ev] is 'function'
    delete @_callbacks[ev]

  @off.message = (listener)->
    RT.onMessage.removeListener listener

  @off.connect = (listener)->
    RT.onConnect.removeListener listener

  @getBackgroundPage = (onGet)->

  @getManifest = ()->
  @getURL = ()->
  @reload = ()->
  @requestUpdateCheck = ()->

  @connect = (connectInfo)->
    RT.connect connectInfo

  @connectNative = ()->

  @sendMessageToOwn = (message, response)->
    if response
      RT.sendMessage null, message, response
    else
      RT.sendMessage null, message

  @sendMessageToExtension = (extensionId, message, response)->
    RT.sendMessage extensionId, message, response

  @sendNativeMessage = ()->

  @onStartup = ()=>
  @onInstalled = ()=>
  @onSuspend = ()=>
  @onSuspendCanceled = ()=>
  @onUpdateAvailable = ()=>
  @onBrowserUpdateAvailable = ()=>

  @onConnect = (listener)=>
    RT.onConnect.addListener listener

  @onConnectExternal = ()=>

  @onMessage = (listener)=>
    RT.onMessage.addListener listener

  @onMessageExternal = ()=>

module.exports = Runtime
