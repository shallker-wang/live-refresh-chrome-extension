var exports = this;

function init() {
  exports.__liverefresh_initialized__ = true;
  var Liverefresh = require('liverefresh');
  new Liverefresh;
}

function ready() {
  if (exports.__liverefresh_initialized__) {
    return;
  }
  init()
}

(function() {
  if (document.readyState === 'complete') {
    return ready();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', ready, false);
    window.addEventListener('load', ready, false);
    return;
  }

  if (document.attachEvent) {
    document.attachEvent('onreadystatechange', ready, false);
    window.attachEvent('onload', ready);
  }  
})()
