log = require('../util/debuger').log('Reloader')
error = require('../util/debuger').error('Reloader')
dom = require('./dom')
require('css-auto-reload')

class Reloader

  @reload: (file)->
    @refresh()

  @reloadJS: (jsFile)->
    @refresh()

  @reloadCSS: (cssFile)->
    log 'reloadCSS', cssFile
    document.styleSheets.reload()

  @reloadHTML: (htlmFile)->
    @refresh()

  @reloadImage: (imageFile)->
    @refresh()

  @refresh: ->
    location.reload()

module.exports = Reloader
