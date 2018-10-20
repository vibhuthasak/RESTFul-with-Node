// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('../config');

// Container for all helpers file
var helpers = {};

// helpers.hash
helpers.hash = function(str) {
  if (typeof(str) === 'string' && str.length > 0){
    return crypto.createHash('sha256', config.hashingSecret).update(str).digest('hex');
  } else {
    return false;
  }
};

// helpers.parseJsonToObject
// Parse a JSON string to an object in all cases, without throwing a error
helpers.parseJsonToObject = function(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return {}
  }
};

// Exporting the module
module.exports = helpers;