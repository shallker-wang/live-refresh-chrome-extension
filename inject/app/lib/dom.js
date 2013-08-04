var doc = document;
var dom = new Object;

dom.getAllCSS = function() {
  var result = new Array;
  var links = doc.getElementsByTagName('link');
  links = Array.prototype.slice.call(links);
  links.forEach(function(link, index) {
    if (link.getAttribute('rel') === 'stylesheet') {
      result.push(link);
    }
  })
  return result;
}

module.exports = dom;
