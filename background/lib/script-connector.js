/* dependencies */
var debug = require('dever').debug('ScriptConnector'),
    error = require('dever').error('ScriptConnector'),
    info = require('dever').info('ScriptConnector'),
    warn = require('dever').warn('ScriptConnector'),
    eventy = require('eventy');

module.exports = function ScriptConnector(tab) {
  var autoReconnect = true;
  var script = {
        liverefresh: '/content-script/build/app.js'
      };

  var connector = function() {
    debug('constructor');
    this.connected = false;
    this.on('connected', function () {
      connector.connected = true;
    })
    this.on('disconnected', function (reconnector) {
      debug('on disconnected');
      connector.connected = false;
      if (!autoReconnect) return;
      reconnector.reconnect();
    })
    tab.on('removed', onTabRemoved);
    tab.on('connect', onTabConnect);
    return this;
  }.call(eventy({}));

  function onTabRemoved() {
    autoReconnect = false;
  }

  function onTabConnect(port) {
    if (port.name !== 'liverefresh') return;
    debug('onConnect');
    var connection = new Connection(port);
    connector.connected = true;
    connector.trigger('connected', connection);
  }

  connector.connect = function () {
    tab.script.insert(script.liverefresh, function (result) {
      debug('script inserted', result);
    })
    return this;
  }

  function Connection(port) {
    var debug = require('dever').debug('Connection');

    var connection = function () {
      this.__proto__ = connector;

      port.onMessage.addListener(onMessage);
      port.onDisconnect.addListener(onDisconnect);        

      return this;
    }.call({});

    function onMessage(message) {
      debug('onMessage', message);
    }

    function onDisconnect(ev) {
      debug('onDisconnect');
      debug('autoReconnect', autoReconnect);

      var reconnector = function (tab) {
        this.__proto__ = connection;

        this.reconnect = function () {
          debug('reconnect')
          debug('tab.removed', tab.removed)
          if (tab.removed) return;
          chrome.tabs.get(tab.id, function (tb) {
            connector.connect();
            reconnector.trigger('reconnect');
          })
        }

        return this;
      }.call({}, tab);

      connection.trigger('disconnected', reconnector);
    }

    connection.send = function (message) {
      port.postMessage(message);
    }

    connection.disconnect = function () {
      port.disconnect();
    }

    return connection;
  }

  return connector;
}
