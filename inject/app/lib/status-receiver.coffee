log = require('../util/debuger').log('StatusReceiver')
error = require('../util/debuger').error('StatusReceiver')
Event = require('./event')
Reloader = require('./reloader')

class StatusReceiver

  constructor: ->

  receive: (message)->
    return error 'invalid message' unless message.status and message.file
    switch message.status
      when 'rename' then @onRename message.file
      when 'change' then @onChange message.file

  onRename: (file)->
    log 'onRename', file
    @reload file

  onChange: (file)->
    log 'onChange', file
    @reload file

  reload: (file)->
    switch @getFileExtension file
      when 'css' then Reloader.reloadCSS file
      when 'html' then Reloader.reloadHTML file
      when 'js' then Reloader.reloadJS file
      else Reloader.reload file

  getFileExtension: (fileName)->
    fileName.split('.').pop()


module.exports = StatusReceiver
