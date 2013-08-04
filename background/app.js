(function(exports) {

  _isEmpty = function(obj) {
    if (typeof obj === 'function') return false;
    if (obj == null || obj === undefined) return true;
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) return false;
    }
    return true;
  }

  _getFolder = function(path) {
    var split = path.split('/');
    split.pop();
    return split.join('/') + '/';
  }

  function Modular() {}

  Modular.extensions = ['js', 'coffee'];
  Modular.modules = {}

  Modular.define = function(path, module) {
    Modular.modules[path] = module;
  }

  Modular.initRequire = function(folder) {
    return function(path) {
      var absolute = /^\//;
      var current = /^\.\//;
      var parent = /^\.\.\//;
      path.replace(current, '');
      if (absolute.test(path)) {
        path = path;
      } else if (current.test(path)) {
        path = folder + path.replace(current, '');
      } else if (parent.test(path)) {
        path = Modular.lookUp(folder, path);
      } else {
        path = folder + path;
      }
      return Modular.require(path);
    }
  }

  Modular.lookUp = function(folder, path) {
    if (folder === '') throw 'break through root';
    var parent = /^\.\.\//;
    folder = folder.split('/');
    folder.pop();
    folder.pop();
    folder.push('');
    folder = folder.join('/');
    path = path.replace(parent, '');
    if (parent.test(path)) Modular.lookUp(folder, path);
    return folder + path;
  }

  Modular.require = function(path) {
    path = Modular.parsePath(path);
    var folder = _getFolder(path);
    var code = Modular.loadModule(path);
    var module = {};
    var exports = module.exports = {};
    var require = Modular.initRequire(folder);
    code.call({}, exports, require, module);
    if (_isEmpty(module.exports)) {
      module.exports = undefined;
    }
    return module.exports;
  }

  Modular.parsePath = function(path) {
    path = path.split('.');
    var ext = path.pop();
    if (Modular.extensions.indexOf(ext) === -1) path.push(ext);
    return path.join('.');
  }

  Modular.loadModule = function(path) {
    var module = Modular.modules[path];
    if ( module === undefined) {
      throw 'cannot find module ' + path;
    }
    return module;
  }

  exports.define = Modular.define;
  exports.require = Modular.initRequire('/');

})(this);

define('/activator', function(exports, require, module) {
(function() {
  var Activator, BrowserAction, Connector, Event, Runtime, Tabs, error, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Tabs = require('chrome/tabs');

  Runtime = require('chrome/runtime');

  BrowserAction = require('chrome/browser-action');

  Event = require('lib/event');

  Connector = require('connector');

  log = require('./util/debuger').log('Activator');

  error = require('./util/debuger').error('Activator');

  Activator = (function() {
    var icon;

    Activator.prototype.activated = false;

    icon = {
      on: '/icons/on/38.png',
      off: '/icons/off/38.png',
      running: '/icons/running/38.png'
    };

    function Activator(tab) {
      this.tab = tab;
      this.destroy = __bind(this.destroy, this);
      this.onClickIcon = __bind(this.onClickIcon, this);
      log('constructor');
      Event.attachTo(this);
      BrowserAction.on('click', this.onClickIcon);
      this.activate();
    }

    Activator.prototype.onClickIcon = function(tab) {
      log('onClickIcon');
      if (this.activated) {
        return this.inactivate();
      } else {
        return this.activate();
      }
    };

    Activator.prototype.connect = function() {
      var _this = this;
      if (!this.connector) {
        this.connector = new Connector(this.tab);
        this.connector.bind('connected', function() {
          if (_this.activated) {
            return _this.setIcon(icon.running);
          }
        });
        this.connector.bind('disconnected', function() {
          if (_this.activated) {
            return _this.setIcon(icon.on);
          }
        });
      }
      return this.connector.connect();
    };

    Activator.prototype.disconnect = function() {
      return this.connector.disconnect();
    };

    Activator.prototype.activate = function() {
      log('activate');
      this.activated = true;
      this.setIcon(icon.on);
      this.connect();
      return this.trigger('activate');
    };

    Activator.prototype.inactivate = function() {
      this.activated = false;
      this.setIcon(icon.off);
      this.disconnect();
      return this.trigger('inactivate');
    };

    Activator.prototype.setIcon = function(icon) {
      log('setIcon', icon);
      return BrowserAction.setIconOfTab(icon, this.tab.id);
    };

    Activator.prototype.destroy = function() {
      BrowserAction.off('click', this.onClickIcon);
      this.connector.destroy();
      this.connector = null;
      return this.trigger('destroy');
    };

    return Activator;

  })();

  module.exports = Activator;

}).call(this);
});

define('/background', function(exports, require, module) {
(function() {
  var Activator, Background, BrowserAction, Tabs, error, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require('./util/debuger').log('Background');

  error = require('./util/debuger').error('Background');

  Tabs = require('chrome/tabs');

  BrowserAction = require('chrome/browser-action');

  Activator = require('activator');

  Background = (function() {
    Background.prototype.initializedTabs = {};

    function Background() {
      this.onTabRemoved = __bind(this.onTabRemoved, this);
      this.onClickIcon = __bind(this.onClickIcon, this);
      log('constructor');
      BrowserAction.on('click', this.onClickIcon);
      Tabs.on('removed', this.onTabRemoved);
    }

    Background.prototype.onClickIcon = function(tab) {
      log('onClickIcon');
      if (tab.url.match(/^chrome:\/\//)) {
        return;
      }
      if (this.isInitializedTab(tab.id)) {
        return;
      }
      return this.initializeTab(tab);
    };

    Background.prototype.onTabRemoved = function(tabId, removeInfo) {
      log('onTabRemoved', tabId, removeInfo);
      if (!this.isInitializedTab(tabId)) {
        return;
      }
      this.initializedTabs[tabId].destroy();
      return this.removeTab(tabId);
    };

    Background.prototype.initializeTab = function(tab) {
      var activator;
      activator = new Activator(tab);
      return this.addTab(tab.id, activator);
    };

    Background.prototype.addTab = function(tabId, activator) {
      if (this.isInitializedTab(tabId)) {
        return error('added tab');
      }
      return this.initializedTabs[tabId] = activator;
    };

    Background.prototype.removeTab = function(tabId) {
      if (!this.isInitializedTab(tabId)) {
        return error('removed tab');
      }
      return delete this.initializedTabs[tabId];
    };

    Background.prototype.isInitializedTab = function(tabId) {
      return this.initializedTabs[tabId];
    };

    return Background;

  })();

  module.exports = Background;

}).call(this);
});

define('/connector', function(exports, require, module) {
(function() {
  var BrowserAction, Connector, Event, Runtime, Tabs, error, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Event = require('lib/event');

  Tabs = require('chrome/tabs');

  Runtime = require('chrome/runtime');

  BrowserAction = require('chrome/browser-action');

  log = require('./util/debuger').log('Connector');

  error = require('./util/debuger').error('Connector');

  Connector = (function() {
    var js;

    js = {
      liverefresh: '/inject/liverefresh.js',
      init: '/inject/init.js'
    };

    Connector.prototype.beConnected = false;

    Connector.prototype.scriptConnected = false;

    Connector.prototype.connected = false;

    Connector.prototype.port = null;

    function Connector(tab) {
      this.tab = tab;
      this.onDisconnected = __bind(this.onDisconnected, this);
      this.onConnected = __bind(this.onConnected, this);
      this.onMessageError = __bind(this.onMessageError, this);
      this.onMessageStatus = __bind(this.onMessageStatus, this);
      this.onMessage = __bind(this.onMessage, this);
      this.onScriptDisconnect = __bind(this.onScriptDisconnect, this);
      this.onScriptConnect = __bind(this.onScriptConnect, this);
      window.tab = this.tab;
      Event.attachTo(this);
      Runtime.on('connect', this.onScriptConnect);
    }

    Connector.prototype.injectScripts = function() {
      var _this = this;
      if (!this.tab) {
        return error('missing tab');
      }
      return Tabs.injectScript(this.tab.id, js.liverefresh, function() {
        log('injectLiverefreshJS', arguments);
        return Tabs.injectScript(_this.tab.id, js.init, function() {
          return log('injectInitJS', arguments);
        });
      });
    };

    Connector.prototype.sendMessage = function(message) {
      if (!this.port) {
        return error('not connected');
      }
      return this.port.postMessage(message);
    };

    Connector.prototype.sendAction = function(action) {
      return this.sendMessage({
        type: 'action',
        action: action
      });
    };

    Connector.prototype.onScriptConnect = function(port) {
      log('onScriptConnect', port);
      this.port = port;
      this.port.onMessage.addListener(this.onMessage);
      this.port.onDisconnect.addListener(this.onScriptDisconnect);
      this.scriptConnected = true;
      if (this.beConnected) {
        this.connect();
      }
      return this.trigger('script-connect');
    };

    Connector.prototype.onScriptDisconnect = function(PortImpl) {
      var injectinues,
        _this = this;
      log('onScriptDisconnect', arguments);
      this.port = null;
      this.scriptConnected = false;
      if (this.beConnected) {
        (injectinues = function() {
          var e;
          if (!_this.beConnected) {
            return;
          }
          if (_this.scriptConnected) {
            return;
          }
          try {
            _this.injectScripts();
          } catch (_error) {
            e = _error;
            log('inject scripts failed', e.message);
          }
          return window.setTimeout(injectinues, 1000);
        })();
      }
      return this.trigger('script-disconnect');
    };

    Connector.prototype.onMessage = function(message) {
      log('onMessage', message);
      switch (message.type) {
        case 'status':
          return this.onMessageStatus(message.status);
        case 'error':
          return this.onMessageError(message.error);
      }
    };

    Connector.prototype.onMessageStatus = function(status) {
      switch (status) {
        case 'connected':
          return this.onConnected();
        case 'disconnected':
          return this.onDisconnected();
      }
    };

    Connector.prototype.onMessageError = function(error) {};

    Connector.prototype.onConnected = function() {
      this.connected = true;
      return this.trigger('connected');
    };

    Connector.prototype.onDisconnected = function() {
      this.connected = false;
      return this.trigger('disconnected');
    };

    Connector.prototype.connect = function() {
      this.beConnected = true;
      if (this.scriptConnected) {
        return this.sendAction('connect');
      } else {
        return this.injectScripts();
      }
    };

    Connector.prototype.disconnect = function() {
      this.beConnected = false;
      if (this.scriptConnected) {
        return this.sendAction('disconnect');
      }
    };

    Connector.prototype.destroy = function() {
      var e;
      this.tab = null;
      this.disconnect();
      Runtime.off('connect', this.onScriptConnect);
      try {
        return this.destroyPort();
      } catch (_error) {
        e = _error;
        return log('destroy port failed', e);
      }
    };

    Connector.prototype.destroyPort = function() {
      this.port.onMessage.removeListener(this.onMessage);
      this.port.onDisconnect.removeListener(this.onScriptDisconnect);
      this.sendAction('destroy');
      return this.port = null;
    };

    return Connector;

  })();

  module.exports = Connector;

}).call(this);
});

define('/chrome/browser-action', function(exports, require, module) {
(function() {
  var BrowserAction;

  BrowserAction = (function() {
    var BA;

    function BrowserAction() {}

    BA = chrome.browserAction;

    BrowserAction._callbacks = {};

    BrowserAction.openTab = function(url) {
      return chrome.tabs.create({
        url: url
      });
    };

    BrowserAction.setBadgeTip = function(tip) {
      if (tip === 0 || tip === '0') {
        tip = '';
      }
      return chrome.browserAction.setBadgeText({
        text: String(tip)
      });
    };

    /*
    @detail {popup: 'login.html', [tabId: 534]}
    */


    BrowserAction.setPopup = function(htmlFile) {
      return BA.setPopup({
        popup: htmlFile
      });
    };

    BrowserAction.setPopupOfTab = function(htmlFile, tabId) {
      return BA.setPopup({
        popup: htmlFile,
        tabId: tabId
      });
    };

    BrowserAction.getPopup = function(onGet) {
      return BA.getPopup({}, onGet);
    };

    BrowserAction.getPopupOfTab = function(tabId, onGet) {
      return BA.getPopup({
        tabId: tabId
      }, onGet);
    };

    BrowserAction.setIcon = function(iconPath) {
      return BA.setIcon({
        path: iconPath
      });
    };

    BrowserAction.setIconOfTab = function(iconPath, tabId) {
      return BA.setIcon({
        path: iconPath,
        tabId: tabId
      });
    };

    BrowserAction.setIconByImageData = function(imageData) {
      return BA.setIcon({
        imageData: imageData
      });
    };

    BrowserAction.setIconByImageDataOfTab = function(imageData, tabId) {
      return BA.setIcon({
        imageData: imageData,
        tabId: tabId
      });
    };

    BrowserAction.clearBadgeTip = function() {
      return BA.setBadgeTip('');
    };

    BrowserAction.setToolTip = function(tip) {
      return BA.setTitle({
        title: String(tip)
      });
    };

    BrowserAction.on = function(ev, cb) {
      if (typeof this.on[ev] === 'function') {
        return this.on[ev](cb);
      }
      return this._callbacks[ev] = cb;
    };

    BrowserAction.on.click = function(callback) {
      return BA.onClicked.addListener(callback);
    };

    BrowserAction.off = function(ev, cb) {
      if (typeof this.off[ev] === 'function') {
        return this.off[ev](cb);
      }
      return delete this._callbacks[ev];
    };

    BrowserAction.off.click = function(callback) {
      return BA.onClicked.removeListener(callback);
    };

    return BrowserAction;

  })();

  module.exports = BrowserAction;

}).call(this);
});

define('/chrome/runtime', function(exports, require, module) {
(function() {
  var Runtime;

  Runtime = (function() {
    var RT,
      _this = this;

    function Runtime() {}

    RT = chrome.runtime;

    Runtime._callbacks = {};

    Runtime.on = function(ev, cb) {
      if (typeof this.on[ev] === 'function') {
        return this.on[ev](cb);
      }
      return this._callbacks[ev] = cb;
    };

    /*
    listen message from extension
    @onMessage (message, sender, res)->
    */


    Runtime.on.message = function(listener) {
      return RT.onMessage.addListener(listener);
    };

    Runtime.on.connect = function(listener) {
      return RT.onConnect.addListener(listener);
    };

    Runtime.off = function(ev, cb) {
      if (typeof this.off[ev] === 'function') {
        return this.off[ev](cb);
      }
      return delete this._callbacks[ev];
    };

    Runtime.off.message = function(listener) {
      return RT.onMessage.removeListener(listener);
    };

    Runtime.off.connect = function(listener) {
      return RT.onConnect.removeListener(listener);
    };

    Runtime.getBackgroundPage = function(onGet) {};

    Runtime.getManifest = function() {};

    Runtime.getURL = function() {};

    Runtime.reload = function() {};

    Runtime.requestUpdateCheck = function() {};

    Runtime.connect = function(connectInfo) {
      return RT.connect(connectInfo);
    };

    Runtime.connectNative = function() {};

    Runtime.sendMessageToOwn = function(message, response) {
      if (response) {
        return RT.sendMessage(null, message, response);
      } else {
        return RT.sendMessage(null, message);
      }
    };

    Runtime.sendMessageToExtension = function(extensionId, message, response) {
      return RT.sendMessage(extensionId, message, response);
    };

    Runtime.sendNativeMessage = function() {};

    Runtime.onStartup = function() {};

    Runtime.onInstalled = function() {};

    Runtime.onSuspend = function() {};

    Runtime.onSuspendCanceled = function() {};

    Runtime.onUpdateAvailable = function() {};

    Runtime.onBrowserUpdateAvailable = function() {};

    Runtime.onConnect = function(listener) {
      return RT.onConnect.addListener(listener);
    };

    Runtime.onConnectExternal = function() {};

    Runtime.onMessage = function(listener) {
      return RT.onMessage.addListener(listener);
    };

    Runtime.onMessageExternal = function() {};

    return Runtime;

  }).call(this);

  module.exports = Runtime;

}).call(this);
});

define('/chrome/tabs', function(exports, require, module) {
(function() {
  var Tab, Tabs;

  Tab = (function() {
    function Tab() {}

    Tab.prototype.id = 0;

    Tab.prototype.index = 0;

    Tab.prototype.windowId = 0;

    Tab.prototype.openerTabId = 0 || null;

    Tab.prototype.highlighted = true;

    Tab.prototype.active = true || false;

    Tab.prototype.pinned = true || false;

    Tab.prototype.url = '' || null;

    Tab.prototype.title = '' || null;

    Tab.prototype.favIconUrl = '' || null;

    Tab.prototype.status = '' || null;

    Tab.prototype.incognito = true || false;

    return Tab;

  })();

  Tabs = (function() {
    var TB;

    function Tabs() {}

    TB = chrome.tabs;

    Tabs._callbacks = {};

    /*
    get a tab info
    @onGet (tab)->
    */


    Tabs.get = function(tabId, onGet) {
      return TB.get(tabId, onGet);
    };

    /*
    gets the tab that this script call is being made from
    @onGet (tab)->
    */


    Tabs.getCurrent = function(onGet) {
      return TB.getCurrent(onGet);
    };

    /*
    get the active tab in current window
    @onGet (tab)->
    */


    Tabs.getActive = function(onGet) {
      return this.query({
        active: true,
        currentWindow: true
      }, function(tabs) {
        return onGet(tabs[0]);
      });
    };

    /*
    connect to content scripts in a tab
    @return runtime.Port
    */


    Tabs.connect = function(tabId) {};

    /*
    send a single one-time message to content scripts in a specific tab
    @onResponse (response)->
    */


    Tabs.sendMessage = function(tabId, data, onResponse) {
      return TB.sendMessage(tabId, data, onResponse);
    };

    Tabs.create = function() {};

    Tabs.duplicate = function() {};

    Tabs.query = function(match, onMatch) {
      return TB.query(match, onMatch);
    };

    Tabs.highlight = function() {};

    Tabs.update = function() {};

    Tabs.move = function() {};

    Tabs.reload = function() {};

    Tabs.remove = function() {};

    Tabs.detectLanguage = function() {};

    Tabs.captureVisibleTab = function() {};

    Tabs.executeScript = function(tabId, detail, callback) {
      return TB.executeScript(tabId, detail, callback);
    };

    Tabs.injectScript = function(tabId, path, callback) {
      return this.executeScript(tabId, {
        file: path
      }, callback);
    };

    Tabs.injectScriptCode = function(tabId, code, callback) {
      return this.executeScript(tabId, {
        code: code
      }, callback);
    };

    Tabs.insertCSS = function() {};

    Tabs.onCreated = function() {};

    Tabs.onUpdated = function() {};

    Tabs.onMoved = function() {};

    Tabs.onActivated = function() {};

    Tabs.onHighlighted = function() {};

    Tabs.onDetached = function() {};

    Tabs.onAttached = function() {};

    /*
    @callback Function (int: tabId, obj: removeInfo)->
    */


    Tabs.onRemoved = function(callback) {
      return TB.onRemoved.addListener(callback);
    };

    Tabs.onReplaced = function() {};

    Tabs.on = function(ev, cb) {
      if (typeof this.on[ev] === 'function') {
        return this.on[ev](cb);
      }
      return this._callbacks[ev] = cb;
    };

    Tabs.on.removed = function(callback) {
      return TB.onRemoved.addListener(callback);
    };

    Tabs.off = function(ev, cb) {
      if (typeof this.off[ev] === 'function') {
        return this.off[ev](cb);
      }
      return delete this._callbacks[ev];
    };

    Tabs.off.removed = function(callback) {
      return TB.onRemoved.removeListener(callback);
    };

    return Tabs;

  })();

  module.exports = Tabs;

}).call(this);
});

define('/lib/event', function(exports, require, module) {
var log = require('../util/debuger').log('Event');

function error(message) {
  var err = new Error(message);
  err.from = 'Event';
  throw err;
}

function Event() {

  var self = this;

  /* Check if this is the first time binding an event */
  function isRegistered(eventName) {
    if (typeof self._eventStack[eventName] === 'undefined') {
      return false;
    }
    return true;
  }

  /**
   * Take a position in the event stack.
   * @param {String} eventName
   * @return {Array} event callback list
   */
  function registerEvent(eventName) {
    log('register', eventName);
    if (typeof self._eventStack[eventName] !== 'undefined') {
      return error('event ' + eventName + ' already registered');
    }
    return self._eventStack[eventName] = [];
  }

  /* Remove event from event stack */
  function unregisterEvent(eventName) {
    return delete self._eventStack[eventName];
  }

  /* Append a listener into event callback list */
  function appendEventListener(eventName, eventCallback) {
    return self._eventStack[eventName].push(eventCallback);
  }

  /* Delete one callback from event callback list */
  function deleteEventListener(eventName, eventListener) {
    var callbacks = getEventCallbacks(eventName);
    callbacks.forEach(function(callback, index) {
      if (callback === eventListener) {
        callbacks.splice(index, 1);
      }
    })
    return resetEventCallbacks(eventName, callbacks);
  }

  /* Return the callback list of the event */
  function getEventCallbacks(eventName) {
    if (!isRegistered(eventName)) {
      return error('event ' + eventName + 'is not registered');
    }
    return self._eventStack[eventName];
  }

  /* Overwrite event callback list */
  function resetEventCallbacks(eventName, eventCallbacks) {
    return self._eventStack[eventName] = eventCallbacks;
  }

  this._eventStack = {};

  /**
   * Append a listener into event's callback list
   * @param {String} eventName
   * @param {Function} eventCallback
   * @return {Object} event object itself
   */
  this.bind = function(eventName, eventCallback) {
    if (!isRegistered(eventName)) {
      registerEvent(eventName);
    }
    appendEventListener(eventName, eventCallback);
    return this;
  }

  /**
   * Calling every listeners of the event.
   * @param {String} eventName
   * @param {Array} callbackArguments
   * @return {Object} event object itself
   */
  this.trigger = function(eventName, callbackArguments) {
    log('trigger', eventName);
    if (!isRegistered(eventName)) {
      return this;
    }
    if (typeof callbackArguments === 'undefined') {
      callbackArguments = [];
    }
    var callbacks = this._eventStack[eventName];
    callbacks.forEach(function(callback, index) {
      if (typeof callback !== 'function') {
        return error('event ' + eventName + ' callback is not a function');
      }
      callback.apply({}, callbackArguments);
    })
    return this;
  }

  /**
   * Remove one callback from event callback list
   * @param {String} eventName
   * @param {Function} eventCallback
   * @return {Boolean} result of the deletion of the event callback
   */
  this.unbind = function(eventName, eventCallback) {
    if (!isRegistered(eventName)) {
      return this;
    }
    if (typeof eventCallback === 'undefined') {
      return unregisterEvent(eventName);
    }
    return deleteEventListener(eventName, eventCallback);
  }
}

module.exports = exports = new Event;

/* Instsall event to an object */
exports.attachTo = function(object) {
  Event.call(object);
}

/* Enable debug output */
exports.debug = function(enable) {
  logger.output = enable;
}
});

define('/util/debuger', function(exports, require, module) {
var debuger = new Object;

debuger.output = true;

debuger.log = function(masterName) {
  if (!debuger.output) return;
  return function() {
    var argumentsArray = Array.prototype.slice.call(arguments);
    argumentsArray.unshift(masterName);
    console.log.apply(console, argumentsArray);    
  }
}

debuger.set = function(name, value) {
  if (typeof debuger.set[name] === 'function') return debuger.set[name](value);
  debuger[name] = value;
  return debuger;
}

debuger.get = function(name) {
  if (typeof debuger.get[name] === 'function') return debuger.get[name](name);
  return debuger[name];
}

debuger.error = function(masterName) {
  return function(message) {
    err = new Error(message)
    err.from = masterName
    throw err
  }
}

module.exports = debuger;
});
