// SubHandler file for 'checks' route

const _data = require('../data');
const helpers = require('../helpers');
const config = require('../../config');
const {verifyToken} = require('./tokens');

// Container for the checks sub methods
_checks = {};

// checks - post
// Required data : protocol, url, method, statusCodes, timeoutSeconds
// Optional data: none
_checks.post = function (data, callback) {
	// Validate inputs
	var protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof (data.payload.url) === 'string' && data.payload.url.length > 0 ? data.payload.url : false;
	var method = typeof (data.payload.method) === 'string' && ['get', 'put', 'post', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var statusCodes = typeof (data.payload.statusCodes) === 'object' && data.payload.statusCodes instanceof Array && data.payload.statusCodes.length > 0 ? data.payload.statusCodes : false;
	var timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds < config.maxChecks ? data.payload.timeoutSeconds : false;

	if (protocol && url && method && statusCodes && timeoutSeconds) {
		// Get the token from the headers
		var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

		// Lookup the user by reading the token
		_data.read('tokens', token, function (err, tokenData) {
			if (!err && tokenData) {
				var userPhone = tokenData.phone;

				// Lookup the user data
				_data.read('users', userPhone, function (err, userData) {
					if (!err && userData) {
						var userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
						// Verify that user has less than number of checks-per-user
						if (userChecks.length < config.maxChecks) {
							// Create a random id for the check
							var checkid = helpers.createRandomString(20);

							// Create the check object, and include the user's phone
							var checkObject = {
								'id': checkid,
								'userPhone': userPhone,
								'protocol': protocol,
								'url': url,
								'method': method,
								'statusCodes': statusCodes,
								'timeoutSeconds': timeoutSeconds
							};

							// Save the object
							_data.create('checks', checkid, checkObject, function (err) {
								if (!err) {
									// Add the check id to the user's object
									userData.checks = userChecks;
									userData.checks.push(checkid);

									// Save the new user data
									_data.update('users', userPhone, userData, function (err) {
										if (!err) {
											callback(200, checkObject)
										} else {
											callback(500, {
												'Error': 'Could not update the user with the new checks'
											})
										}
									})
								} else {
									callback(500, {
										'Error': 'Could not create the new check'
									})
								}
							})
						} else {
							callback(400, {
								'Error': 'The user already has the maximum number of checks'
							});
						}
					} else {
						callback(403);
					}
				})
			} else {
				callback(403);
			}
		})
	} else {
		callback(400, {
			'Error': 'Missing required inputs, or Invalid inputs'
		});
	}
};

// checks - get
// Required : id,
// Optional : None
_checks.get = function (data, callback) {
	var id = typeof (data.query.id) === 'string' && data.query.id.trim().length === 20 ? data.query.id : false;

	if (id) {
		// lookup the check
		_data.read('checks', id, function (err, checkData) {
			if (!err && checkData) {
				// Get the token from the header
				var token = (typeof (data.headers.token) === 'string') ? data.headers.token : false;
				// Verify the token that given token is valid and belong to the user
				verifyToken(token, checkData.userPhone, function (tokenIsValied) {
					if (tokenIsValied) {
						// Return the checkdata
						callback(200, checkData)
					} else {
						callback(403, {
							'Error': 'Invalid token'
						});
					}
				})
			} else {
				callback(404);
			}
		});

	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}
};

// checks - put
// Required data : id
// Optional data : protocol, url, method, statusCodes, timeoutSeconds
_checks.put = function (data, callback) {
	// Check for the required field
	var id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;

	// Check for the optional fields
	var protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof (data.payload.url) === 'string' && data.payload.url.length > 0 ? data.payload.url : false;
	var method = typeof (data.payload.method) === 'string' && ['get', 'put', 'post', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var statusCodes = typeof (data.payload.statusCodes) === 'object' && data.payload.statusCodes instanceof Array && data.payload.statusCodes.length > 0 ? data.payload.statusCodes : false;
	var timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds < config.maxChecks ? data.payload.timeoutSeconds : false;

	if (id) {
		if (protocol || url || method || statusCodes || timeoutSeconds) {
			// Looking up the check
			_data.read('checks', id, function (err, checkData) {
				if (!err && checkData) {
					// Verify the token is valid
					var token = (typeof (data.headers.token) === 'string') ? data.headers.token : false;
					verifyToken(token, checkData.userPhone, function (tokenIsValied) {
						if (tokenIsValied) {
							// Update the check where nessasary
							if (protocol) {
								checkData.protocol = protocol;
							}
							if (url) {
								checkData.url = url;
							}
							if (method) {
								checkData.method = method;
							}
							if (statusCodes) {
								checkData.statusCodes = statusCodes;
							}
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}

							// Store the new updates
							_data.update('checks', id, checkData, function (err) {
								if (!err) {
									callback(200)
								} else {
									callback(500, {
										'Error': 'Could not update checks'
									})
								}
							})
						} else {
							callback(403, {
								'Error': 'Invalid token'
							});
						}
					});
				} else {
					callback(404, {
						'Error': 'Check ID not exists'
					})
				}
			})
		} else {
			callback(400, {
				"Error": "Missing optional fields"
			});
		}
	} else {
		callback(400, {
			"Error": "Missing required fields"
		});
	}
};

// checks - delete
// Required fields : phone
// TODO: Cleanup (delete) any other data files associated with this user
_checks.delete = function (data, callback) {
};

module.exports = _checks;
