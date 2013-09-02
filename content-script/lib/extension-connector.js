/* dependencies */
var debug = require('dever').debug('Connector'),
    error = require('dever').error('Connector'),
    info = require('dever').info('Connector'),
    warn = require('dever').warn('Connector'),
    eventy = require('eventy'),
    browserAction = chrome.browserAction,
    runtime = chrome.runtime,
    tabs = chrome.tabs;

module.exports = function ExtensionConnector() {
  var connector = function () {
    return this;
  }.call(eventy({}));

  connector.connect = function () {
    var port = runtime.connect({name: 'liverefresh'});
    var connection = new Connection(port);
    this.trigger('connected', connection);

    function Connection(port) {
      var autoReconnect;

      var connection = function () {
        this.__proto__ = connector;
        port.onDisconnect.addListener(onDisconnect);
        port.onMessage.addListener(onMessage);
        return this;
      }.call({});

      function onMessage(message) {
        debug('onMessage');
        connection.trigger('message', message);
      }

      function onDisconnect() {
        debug('onDisconnect');
        connection.trigger('disconnected');
      }

      connection.disconnect = function () {
        port.disconnect()
      }

      return connection;      
    }

    return this;
  }

  return connector;
}
