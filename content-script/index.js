/* dependencies */
var debug = require('dever').debug('index'),
    error = require('dever').error('index'),
    info = require('dever').info('index'),
    warn = require('dever').warn('index'),
    eventy = require('eventy'),
    ExtensionConnector = require('./lib/extension-connector'),
    MessageExecuter = require('./lib/message-executer');

/* try to give dever a development configuration */
try {require('dever').config(require('dev.json'))} catch (e) {}

/* main function */
var connector = new ExtensionConnector;
var executer = new MessageExecuter;

var liverefresh = function() {

  connector.on('message', function (message) {
    executer.execute(message);
  })

  connector.connect();

  return this;
}.call(eventy({}));
