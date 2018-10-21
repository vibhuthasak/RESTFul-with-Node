// Subhandler file for tokens

const _data = require('../data');
const helpers = require('../helpers');

// Container for tokens methods
_tokens = {};

// Tokens - Post
// Required data : phone, password
// Optional : None
_tokens.post = function (data, callback) {
	var phone = (typeof (data.payload.phone) === 'string') && (data.payload.phone.trim().length === 10) ? data.payload.phone.trim() : false;
	var password = (typeof (data.payload.password) === 'string') && (data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
	if (phone && password) {
		// Lookup the user who matched that phone number
		_data.read('users', phone, function (err, userData) {
			if (!err && userData) {
				// Hash the sent password and compare the password in userObject
				var hashedPassword = helpers.hash(password);
				if (hashedPassword === userData.password) {
					//  Create a new token with expiration date with 1hr
					var tokenId = helpers.createRandomString(64);
					var expires = Date.now() + (1000 * 60 * 60);

					// Token Object
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					}

					// Store the token
					_data.create('tokens', tokenId, tokenObject, function (err) {
						if (!err) {
							callback(200, tokenObject);
						} else {
							callback(500, {
								'Error': 'Could not create the new token'
							});
						};
					})
				} else {
					callback(400, {
						'Error': 'Password did not match'
					})
				}
			} else {
				callback(400, {
					'Error': 'Could not find the specified user'
				})
			}
		})
	} else {
		callback(400, {
			'Error': 'Missing required field(s)'
		})
	}
};

// Tokens - Get
_tokens.get = function (data, callback) {
	// Checking the id is valid
	var id = typeof (data.query.id) === 'string' && data.query.id.trim().length === 64 ? data.query.id : false;
	if (id) {
		// Lookup the user
		_data.read('tokens', id, function (err, tokenData) {
			if (!err && tokenData) {
				callback(200, tokenData);
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

// Tokens - Put
// Required data : id, extend
// Optional data : none
_tokens.put = function (data, callback) {
	var id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 64 ? data.payload.id : false;
	var extend = (typeof (data.payload.extend) === 'boolean' && data.payload.extend === true);

	if (id && extend) {
		// Lookup the token
		_data.read('tokens', id, function(err, tokenData){
			if(!err && tokenData){
				// Checking to make sure that the token is not expired
				if(tokenData.expires > Date.now()){
					// Set the expiration an hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60;
 					// Store the new updates
					_data.update('tokens', id, tokenData, function(err){
						if(!err){
							callback(200);
						} else {
							callback(500, {'Error' : 'Could not update the token'});
						}
					});
				} else {
					callback(400, {'Error' : 'The token is already expired and cannot be extended'});
				}
			} else {
				callback(400, {'Error' : 'Specified token doesnot exist'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required field(s)'});
	}
};

// Tokens - Delete
// Required data : id
// Optional data : none
_tokens.delete = function (data, callback) {
	var id = typeof (data.query.id) === 'string' && data.query.id.trim().length === 64 ? data.query.id : false;
	if (id) {
		// Lookup the id
		_data.read('tokens', id, function (err, data) {
			if (!err && data) {
				//Remove the user
				_data.delete('tokens', id, function (err) {
					if (!err) {
						callback(200);
					} else {
						callback(500, {
							'Error': 'Server Error'
						});
					}
				});
			} else {
				callback(400, {
					'Error': 'Could not find the token'
				});
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}
};

// Verity the token if it is valied for the given user
_tokens.verifyToken = function(id, phone, callback) {
	// Looking up for the token
	_data.read('tokens', id, function(err, tokenData){
		if(!err && tokenData) {
			// Checking that the token is for the gicen user and has not expired
			if(tokenData.phone === phone && tokenData.expires > Date.now()){
				callback(200);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
}

module.exports = _tokens;