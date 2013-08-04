class BrowserAction

  BA = chrome.browserAction

  @_callbacks = {}

  @openTab = (url)->
    chrome.tabs.create url: url

  @setBadgeTip = (tip)->
    tip = '' if tip is 0 or tip is '0'
    chrome.browserAction.setBadgeText text: String tip

  # Popup
  ###
  @detail {popup: 'login.html', [tabId: 534]}
  ###
  @setPopup: (htmlFile)->
    BA.setPopup {popup: htmlFile}

  @setPopupOfTab: (htmlFile, tabId)->
    BA.setPopup {popup: htmlFile, tabId: tabId}

  @getPopup: (onGet)->
    BA.getPopup {}, onGet

  @getPopupOfTab: (tabId, onGet)->
    BA.getPopup {tabId: tabId}, onGet

  # Icon
  @setIcon: (iconPath)->
    BA.setIcon {path: iconPath}

  @setIconOfTab: (iconPath, tabId)->
    BA.setIcon {path: iconPath, tabId: tabId}

  @setIconByImageData: (imageData)->
    BA.setIcon {imageData: imageData}

  @setIconByImageDataOfTab: (imageData, tabId)->
    BA.setIcon {imageData: imageData, tabId: tabId}

  # Badge
  @clearBadgeTip = ->
    BA.setBadgeTip ''

  @setToolTip = (tip)->
    BA.setTitle title: String tip

  @on = (ev, cb)->
    return @on[ev](cb) if typeof @on[ev] is 'function'
    @_callbacks[ev] = cb

  @on.click = (callback)->
    BA.onClicked.addListener callback

  @off = (ev, cb)->
    return @off[ev](cb) if typeof @off[ev] is 'function'
    delete @_callbacks[ev]

  @off.click = (callback)->
    BA.onClicked.removeListener callback

module.exports = BrowserAction
