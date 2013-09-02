/* dependencies */
var debug = require('dever').debug('index'),
    error = require('dever').error('index'),
    info = require('dever').info('index'),
    warn = require('dever').warn('index'),
    eventy = require('eventy'),
    Activator = require('./lib/activator'),
    ServerConnector = require('./lib/server-connector'),
    ScriptConnector = require('./lib/script-connector'),
    tabs = require('chrome-tabs');

/* try to give dever a development configuration */
try {require('dever').config(require('dev.json'))} catch (e) {}

/* main function */
var serverConnector;

var background = function() {
  this.version = '2.0.0';
  tabs.on('created', onTabCreated)
  return this;
}.call(eventy({}));

function onTabCreated(tab) {
  var scriptConnector;
  var scriptConnection;
  debug('onTabCreated', tab.id);
  var activator = new Activator(tab);
  activator.on('activate', onActivate);
  activator.on('deactivate', onDeactivate);

  function onActivate(tab) {
    /* initialize one global server connector for the first time */
    if (!serverConnector) {
      serverConnector = new ServerConnector;
      serverConnector.on('error', onServerError);
      serverConnector.connect();

      function onServerError(err) {
        info('server error', err);
      }
    }

    serverConnector.on('connected', onServerConnected);
    serverConnector.on('disconnected', onServerDisconnected);
    serverConnector.on('message', onServerMessage);

    if (!scriptConnector) {
      scriptConnector = new ScriptConnector(tab);
      scriptConnector.on('error', onScriptError);      
      scriptConnector.connect();
    }

    scriptConnector.on('connected', onScriptConnected);
    scriptConnector.on('disconnected', onScriptDisconnected);

    if (scriptConnector.connected && serverConnector.connected) {
      activator.trigger('connected');
    }
  }

  function onDeactivate(tab) {
    serverConnector.off('connected', onServerConnected);
    serverConnector.off('disconnected', onServerDisconnected);
    serverConnector.off('message', onServerMessage);

    scriptConnector.off('connected', onScriptConnected);
    scriptConnector.off('disconnected', onScriptDisconnected);
  }

  function onServerConnected(connection) {
    if (!scriptConnector.connected) return;
    activator.trigger('connected');
  }

  function onServerDisconnected() {
    activator.trigger('disconnected');
  }

  function onServerMessage(message) {
    if (scriptConnection) {
      scriptConnection.send(message);
    }
  }

  function onScriptError(err) {
    info('script error', err);
  }

  function onScriptConnected(connection) {
    scriptConnection = connection;
    if (!serverConnector.connected) return;
    activator.trigger('connected');
  }

  function onScriptDisconnected() {
    scriptConnection = null;
    activator.trigger('disconnected');
  }

}
