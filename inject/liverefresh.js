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

define('/liverefresh', function(exports, require, module) {
(function() {
  var Connector, Liverefresh, Runtime, error, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Runtime = require('./chrome/runtime');

  log = require('./util/debuger').log('Liverefresh');

  error = require('./util/debuger').error('Liverefresh');

  Connector = require('./lib/connector');

  Liverefresh = (function() {
    Liverefresh.prototype.extensionConnected = false;

    Liverefresh.prototype.connected = false;

    Liverefresh.prototype.extensionId = 0;

    Liverefresh.prototype.server = {
      protocol: 'ws://',
      host: '127.0.0.1',
      port: 35730
    };

    function Liverefresh() {
      this.onMessageAction = __bind(this.onMessageAction, this);
      this.onMessage = __bind(this.onMessage, this);
      this.onExtensionDisconnect = __bind(this.onExtensionDisconnect, this);
      var _this = this;
      log('constructor');
      this.connectExtension();
      this.connector = new Connector("" + this.server.protocol + this.server.host + ":" + this.server.port);
      this.connector.bind('connected', function() {
        return _this.sendStatus('connected');
      });
      this.connector.bind('disconnected', function() {
        return _this.sendStatus('disconnected');
      });
      this.connector.bind('error', function(error) {
        return _this.sendError(error);
      });
    }

    Liverefresh.prototype.connectExtension = function() {
      log('connectExtension');
      this.extensionConnected = true;
      this.port = Runtime.connect({
        name: 'liverefresh'
      });
      this.port.onMessage.addListener(this.onMessage);
      return this.port.onDisconnect.addListener(this.onExtensionDisconnect);
    };

    Liverefresh.prototype.onExtensionDisconnect = function() {
      var connectiues,
        _this = this;
      this.extensionConnected = false;
      this.port = null;
      this.connectiues();
      return connectiues = function() {
        if (_this.extensionConnected) {
          return;
        }
        _this.connectToExtension();
        return window.setTimeout(connectiues, 1000);
      };
    };

    Liverefresh.prototype.sendMessage = function(message) {
      if (!this.port) {
        return error('not connected');
      }
      return this.port.postMessage(message);
    };

    Liverefresh.prototype.sendError = function(error) {
      return this.sendMessage({
        type: 'error',
        error: error
      });
    };

    Liverefresh.prototype.sendStatus = function(status) {
      return this.sendMessage({
        type: 'status',
        status: status
      });
    };

    Liverefresh.prototype.onMessage = function(message) {
      log('onMessage', message);
      switch (message.type) {
        case 'action':
          return this.onMessageAction(message.action);
      }
    };

    Liverefresh.prototype.onMessageAction = function(action) {
      switch (action) {
        case 'connect':
          return this.connector.connect();
        case 'disconnect':
          return this.connector.disconnect();
        case 'destroy':
          return this.destroy();
      }
    };

    Liverefresh.prototype.destroy = function() {
      this.port.onMessage.removeListener(this.onMessage);
      this.port.onDisconnect.removeListener(this.onExtensionDisconnect);
      this.port.disconnect();
      this.port = null;
      return this.connector.destroy();
    };

    return Liverefresh;

  })();

  module.exports = Liverefresh;

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

define('/lib/connector', function(exports, require, module) {
(function() {
  var Connector, Event, StatusReceiver, error, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  log = require('../util/debuger').log('Connector');

  error = require('../util/debuger').error('Connector');

  Event = require('event');

  StatusReceiver = require('./status-receiver');

  Connector = (function() {
    Connector.prototype.connected = false;

    Connector.prototype.socket = null;

    Connector.prototype.server = '';

    Connector.prototype.protocol = 'LR';

    Connector.prototype.version = '1.0';

    Connector.prototype.established = false;

    function Connector(server) {
      this.server = server;
      this.onMessageHandshake = __bind(this.onMessageHandshake, this);
      this.onMessage = __bind(this.onMessage, this);
      this.onError = __bind(this.onError, this);
      this.onClose = __bind(this.onClose, this);
      this.onOpen = __bind(this.onOpen, this);
      Event.attachTo(this);
      this.statusReceiver = new StatusReceiver;
    }

    Connector.prototype.connect = function() {
      if (this.connected) {
        return;
      }
      this.socket = new WebSocket(this.server);
      this.socket.onopen = this.onOpen;
      this.socket.onclose = this.onClose;
      this.socket.onerror = this.onError;
      this.socket.onmessage = this.onMessage;
      return this.socket;
    };

    Connector.prototype.disconnect = function() {
      if (!this.connected) {
        return;
      }
      if (!this.socket) {
        return error('invalid socket');
      }
      if (this.socket.readyState === this.socket.CLOSED) {
        return error('socket already closed');
      }
      this.socket.close();
      return this.socket = null;
    };

    Connector.prototype.establishConnection = function() {
      return this.socket.send(JSON.stringify({
        type: 'handshake',
        protocol: 'LR',
        version: '1.0'
      }));
    };

    Connector.prototype.onOpen = function() {
      log('onOpen', arguments);
      this.connected = true;
      this.trigger('open');
      return this.establishConnection();
    };

    Connector.prototype.onClose = function() {
      log('onClose', arguments);
      this.connected = false;
      this.trigger('close');
      return this.trigger('disconnected');
    };

    Connector.prototype.onError = function() {
      log('onError', arguments);
      return this.trigger('error');
    };

    Connector.prototype.onMessage = function(MessageEvent) {
      var message;
      log('onMessage', arguments);
      this.trigger('message');
      message = JSON.parse(MessageEvent.data);
      switch (message.type) {
        case 'handshake':
          return this.onMessageHandshake(message);
        case 'status':
          return this.statusReceiver.receive(message);
      }
    };

    Connector.prototype.onMessageHandshake = function(message) {
      var failed, version,
        _this = this;
      log('on handshake protocol', message.protocol);
      log('on handshake version', message.version);
      version = parseFloat(message.version);
      failed = function(message) {
        _this.disconnect();
        return error(message);
      };
      if (message.protocol !== this.protocol) {
        return failed("protocol does not match '" + message.protocol + "'");
      }
      if (version < 1) {
        return failed("old version '" + version + "'");
      }
      this.established = true;
      return this.trigger('connected');
    };

    Connector.prototype.getServer = function() {};

    Connector.prototype.destroy = function() {
      return this.disconnect();
    };

    return Connector;

  })();

  module.exports = Connector;

}).call(this);
});

define('/lib/css-auto-reload', function(exports, require, module) {
// http://nv.github.io/css_auto-reload/

StyleSheetList.prototype.reload_interval = 1000; // 1 second

CSSStyleSheet.prototype.reload = function reload(){
  // Reload one stylesheet
  // usage: document.styleSheets[0].reload()
  // return: URI of stylesheet if it could be reloaded, overwise undefined
  if (this.href) {
    var href = this.href;
    var i = href.indexOf('?'),
        last_reload = 'last_reload=' + (new Date).getTime();
    if (i < 0) {
      href += '?' + last_reload;
    } else if (href.indexOf('last_reload=', i) < 0) {
      href += '&' + last_reload;
    } else {
      href = href.replace(/last_reload=\d+/, last_reload);
    }
    return this.ownerNode.href = href;
  }
};

StyleSheetList.prototype.reload = function reload(){
  // Reload all stylesheets
  // usage: document.styleSheets.reload()
  for (var i=0; i<this.length; i++) {
    this[i].reload()
  }
};

StyleSheetList.prototype.start_autoreload = function start_autoreload(miliseconds /*Number*/){
  // usage: document.styleSheets.start_autoreload()
  if (!start_autoreload.running) {
    var styles = this;
    start_autoreload.running = setInterval(function reloading(){
      styles.reload();
    }, miliseconds || this.reload_interval);
  }
  return start_autoreload.running;
};

StyleSheetList.prototype.stop_autoreload = function stop_autoreload(){
  // usage: document.styleSheets.stop_autoreload()
  clearInterval(this.start_autoreload.running);
  this.start_autoreload.running = null;
};

StyleSheetList.prototype.toggle_autoreload = function toggle_autoreload(){
  // usage: document.styleSheets.toggle_autoreload()
  return this.start_autoreload.running ? this.stop_autoreload() : this.start_autoreload();
};});

define('/lib/dom', function(exports, require, module) {
var doc = document;
var dom = new Object;

dom.getAllCSS = function() {
  var result = new Array;
  var links = doc.getElementsByTagName('link');
  links = Array.prototype.slice.call(links);
  links.forEach(function(link, index) {
    if (link.getAttribute('rel') === 'stylesheet') {
      result.push(link);
    }
  })
  return result;
}

module.exports = dom;
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

define('/lib/reloader', function(exports, require, module) {
(function() {
  var Reloader, dom, error, log;

  log = require('../util/debuger').log('Reloader');

  error = require('../util/debuger').error('Reloader');

  dom = require('./dom');

  require('css-auto-reload');

  Reloader = (function() {
    function Reloader() {}

    Reloader.reload = function(file) {
      return this.refresh();
    };

    Reloader.reloadJS = function(jsFile) {
      return this.refresh();
    };

    Reloader.reloadCSS = function(cssFile) {
      log('reloadCSS', cssFile);
      return document.styleSheets.reload();
    };

    Reloader.reloadHTML = function(htlmFile) {
      return this.refresh();
    };

    Reloader.reloadImage = function(imageFile) {
      return this.refresh();
    };

    Reloader.refresh = function() {
      return location.reload();
    };

    return Reloader;

  })();

  module.exports = Reloader;

}).call(this);
});

define('/lib/status-receiver', function(exports, require, module) {
(function() {
  var Event, Reloader, StatusReceiver, error, log;

  log = require('../util/debuger').log('StatusReceiver');

  error = require('../util/debuger').error('StatusReceiver');

  Event = require('./event');

  Reloader = require('./reloader');

  StatusReceiver = (function() {
    function StatusReceiver() {}

    StatusReceiver.prototype.receive = function(message) {
      if (!(message.status && message.file)) {
        return error('invalid message');
      }
      switch (message.status) {
        case 'rename':
          return this.onRename(message.file);
        case 'change':
          return this.onChange(message.file);
      }
    };

    StatusReceiver.prototype.onRename = function(file) {
      log('onRename', file);
      return this.reload(file);
    };

    StatusReceiver.prototype.onChange = function(file) {
      log('onChange', file);
      return this.reload(file);
    };

    StatusReceiver.prototype.reload = function(file) {
      switch (this.getFileExtension(file)) {
        case 'css':
          return Reloader.reloadCSS(file);
        case 'html':
          return Reloader.reloadHTML(file);
        case 'js':
          return Reloader.reloadJS(file);
        default:
          return Reloader.reload(file);
      }
    };

    StatusReceiver.prototype.getFileExtension = function(fileName) {
      return fileName.split('.').pop();
    };

    return StatusReceiver;

  })();

  module.exports = StatusReceiver;

}).call(this);
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
