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

};

// Tokens - Put
_tokens.put = function (data, callback) {

};

// Tokens - Delete
_tokens.delete = function (data, callback) {

};

module.exports = _tokens;