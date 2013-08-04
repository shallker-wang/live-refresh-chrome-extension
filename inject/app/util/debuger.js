var debuger = new Object;

debuger.output = true;

debuger.log = function(masterName) {
  if (!debuger.output) return;
  return function() {
    var argumentsArray = Array.prototype.slice.call(arguments);
    argumentsArray.unshift(masterName);
    console.log.apply(console, argumentsArray);    
  }
}

debuger.set = function(name, value) {
  if (typeof debuger.set[name] === 'function') return debuger.set[name](value);
  debuger[name] = value;
  return debuger;
}

debuger.get = function(name) {
  if (typeof debuger.get[name] === 'function') return debuger.get[name](name);
  return debuger[name];
}

debuger.error = function(masterName) {
  return function(message) {
    err = new Error(message)
    err.from = masterName
    throw err
  }
}

module.exports = debuger;
