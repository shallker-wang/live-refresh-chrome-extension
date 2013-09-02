/* dependencies */
var debug = require('dever').debug('ServerConnector'),
    error = require('dever').error('ServerConnector'),
    info = require('dever').info('ServerConnector'),
    warn = require('dever').warn('ServerConnector'),
    eventy = require('eventy'),
    runtime = chrome.runtime;

module.exports = function ServerConnector() {
  var socket;
  var protocol = 'LR';
  var version = '1.0';
  var server = {
        host: '127.0.0.1',
        port: 35730
      }

  var connector = function () {
    debug('constructor');
    this.connected = false;
    this.on('connected', function () {
      connector.connected = true;
    })
    this.on('disconnected', function () {
      connector.connected = false;
    })
    return this;
  }.call(eventy({}));

  connector.connect = function (callback) {
    debug('connect', server.host + ':' + server.port);
    socket = new WebSocket('ws://' + server.host + ':' + server.port);
    socket.onopen = onOpen;
    socket.onmessage = onMessage;
    socket.onclose = onClose;
    socket.onerror = onError;

    function onOpen() {
      debug('onOpen')
      connector.trigger('open');
      socket.send(JSON.stringify({
        type: 'handshake',
        protocol: protocol,
        version: version
      }));
    }

    function onClose() {
      debug('onClose')
      connector.trigger('close');
    }

    function onError(err) {
      connector.trigger('error', err);
      debug('onError', err)
    }

    function onMessage(ev) {
      var message = JSON.parse(ev.data);
      debug('onmessage', message);
      if (message.type === 'handshake') {
        return onMessageHandshake(message);
      }
    }

    function onMessageHandshake(message) {
      if (message.protocol !== protocol) {
        info('protocol does not match', protocol);
        return;
      }

      var connection = new Connection(socket);
      callback && callback(connection);
      connector.trigger('connected', connection);

      function Connection(socket) {
        var socket = socket;
        var debug = require('dever').debug('Connection');

        var connection = function () {
          this.__proto__ = connector;

          debug('constructor', message.version);
          this.clientVersion = message.version;

          socket.onmessage = onMessage;
          socket.onclose = onClose;

          return this;
        }.call({});

        function onMessage(ev) {
          var message = JSON.parse(ev.data);
          connection.trigger('message', message);
          debug('onMessage', message);
          switch (message.type) {
            case 'status':
              onMessageStatus(message);
              break;
            case 'command':
              onMessageCommand(message);
              break;
            default:
              warn('unrecognized message');
          }
        }

        function onMessageStatus(message) {
          connection.trigger('status', message.status, message.file);
        }

        function onMessageCommand(message) {
          connection.trigger('command', message.command);
        }

        function onClose(ev) {
          debug('onClose')
          connection.trigger('close');
          connection.trigger('disconnected');
        }

        connection.close = function () {
          socket.close()
        }

        return connection;
      }
    }
  }

  connector.disconnect = function () {
    socket.close() && (socket = null);
  }

  return connector;
}
