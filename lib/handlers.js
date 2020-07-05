// Request subHandlers import
const _users = require('./handlerSubMethods/users');
const _tokens = require('./handlerSubMethods/tokens');
const _checks = require('./handlerSubMethods/checks');
const helpers = require('./helpers');

// Handlers object
const handlers = {};

/*
* HTML Handlers
* */

handlers.index = function (data, callback) {
  // Reject any request that is not GET
  if (data.method === 'get') {
    helpers.getTemplate('index', function (err, str) {
      if(!err && str){
        callback(200, str, 'html')
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/*
* JSON API handlers
* */

// Add subHandler for users
handlers._users = _users;
// Add subHandler for tokens
handlers._tokens = _tokens;
// Add subHandler for checks
handlers._checks = _checks;

//Users handler
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405); // unauthorized method
  }
};

// Tokens handler
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405); // unauthorized method
  }
};

// Checks handler
handlers.checks = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405); // unauthorized method
  }
}

// Add sampleRoute handler
handlers.sampleRoute = function (data, callback) {
  callback(200, {
    'route': 'Got the route'
  });
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;