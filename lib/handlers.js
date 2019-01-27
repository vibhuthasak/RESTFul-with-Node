// Request Handlers

const _users = require('./handlerSubMethods/users');
const _tokens = require('./handlerSubMethods/tokens');
const _checks = require('./handlerSubMethods/checks');

// Handlers object
const handlers = {};

//Users handler

handlers.users = function (data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405); // unauthorized method
	}
};

// Add subHandler for users
handlers._users = _users;

// Tokens handler
handlers.tokens = function (data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405); // unauthorized method
	}
};

// Add subhandler for tokens
handlers._tokens = _tokens;

// Checks handler
handlers.checks = function(data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405); // unauthorized method
	}
}

// Add subhandler for checks
handlers._checks = _checks;

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