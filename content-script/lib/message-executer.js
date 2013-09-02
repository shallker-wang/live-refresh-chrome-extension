/* dependencies */
var debug = require('dever').debug('index'),
    error = require('dever').error('index'),
    info = require('dever').info('index'),
    warn = require('dever').warn('index'),
    eventy = require('eventy');
    require('./third/css-auto-reload');

module.exports = function MessageExecuter() {
  var executer = function () {
    return this;
  }.call(eventy({}));

  executer.execute = function (message) {
    switch (message.type) {
      case 'status':
        onMessageStatus(message);
        break;
      case 'command':
        onMessageCommand(message);
        break;
      default:
        info('unrecognized message type');
    }
  }

  function onMessageCommand(message) {
    switch (message.command) {
      case 'refresh-style':
        refreshStyle();
        break;
      case 'refresh':
      case 'refresh-page':
        refreshPage();
        break;
      default:
        info('unrecognized command ' + message.command);
    }
  }

  function onMessageStatus(message) {
    switch (message.status) {
      case 'rename':
        onChange(message.file);
        break;
      case 'change':
        onChange(message.file);
        break;
      default:
        info('unrecognized status ' + message.status);
    }
  }

  function onChange(filename) {
    switch (getExtension(filename)) {
      case 'css':
        refreshStyle()
        break;
      case 'html':
      case 'js':
        refreshPage();
        break;
      default:
        refreshPage();
    }
  }

  function refreshPage() {
    debug('refreshPage');
    window.location.reload();
  }

  function refreshStyle() {
    debug('refreshStyle');
    document.styleSheets.reload();
  }

  function getExtension(filename) {
    return filename.split('.').pop();
  }

  return executer;
}
