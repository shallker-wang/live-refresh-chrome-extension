/* Dependencies */
var debug = require('dever').debug('Activator'),
    error = require('dever').error('Activator'),
    info = require('dever').info('Activator'),
    warn = require('dever').warn('Activator'),
    eventy = require('eventy');

/* Main function */
module.exports = function Activator(tab) {
  var connected = false;
  var icon = {
        on: '/icons/on/38.png',
        off: '/icons/off/38.png',
        running: '/icons/running/38.png'
      };

  var activator = function() {
    debug('constructor', tab.id);
    this.activated = false;
    tab.on('replaced', onTabReplaced);
    tab.on('updated', onTabUpdated);
    tab.on('removed', onTabRemoved);
    tab.on('clicked', onTabClicked);
    this.on('connected', onConnected);
    this.on('disconnected', onDisconnected);
    return this;
  }.call(eventy({}));

  function onConnected() {
    debug('onConnected')
    connected = true;
    updateIcon();
  }

  function onDisconnected() {
    debug('onDisconnected')
    connected = false;
    updateIcon();
  }

  function onTabClicked() {
    debug('onTabClicked', tab.id, this.id, tab)
    if (tab.url.match(/^chrome:\/\//)) return;
    activator.toggleActive();
    activator.trigger('click');
  }

  function onTabRemoved(info) {
    debug('onRemove', info);
    activator.destroy();
  }

  function onTabUpdated(info) {
    debug('onTabUpdate', info);
    updateIcon();
  }

  function onTabReplaced(info) {
    debug('onTabReplaced', info);
    updateIcon();
  }

  function updateIcon() {
    if (tab.removed) return;
    if (!activator.activated) {
      return tab.set('icon.path', icon.off);
    }
    if (connected) {
      return tab.set('icon.path', icon.running);
    }
    tab.set('icon.path', icon.on);
  }

  activator.toggleActive = function () {
    debug('toggleActive')
    if (this.activated) this.deactivate();
    else this.activate();
  }

  activator.activate = function () {
    debug('activate')
    this.activated = true;
    updateIcon();
    this.trigger('activate', tab);
  }

  activator.deactivate = function () {
    debug('deactivate')
    this.activated = false;
    updateIcon();
    this.trigger('deactivate', tab);
  }

  activator.destroy = function () {
    debug('destroy', tab);
    this.trigger('destroy', tab);
  }

  return activator;
}
