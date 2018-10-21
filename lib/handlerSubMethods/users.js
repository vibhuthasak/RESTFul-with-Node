// SubHandler file for 'users' route

const _data = require('../data');
const helpers = require('../helpers');
const {verifyToken} = require('./tokens')

// Container for the users sub methods
_users = {};

// users - post
// Required data : firstName, lastName, phone, password, tosAgreement
// Optional data: none
_users.post = function (data, callback) {
	var firstName = (typeof (data.payload.firstName) === 'string') && (data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
	var lastName = (typeof (data.payload.lastName) === 'string') && (data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
	var phone = (typeof (data.payload.phone) === 'string') && (data.payload.phone.trim().length === 10) ? data.payload.phone.trim() : false;
	var password = (typeof (data.payload.password) === 'string') && (data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
	var tosAgreement = (typeof (data.payload.tosAgreement) === 'boolean') && (data.payload.tosAgreement === true);

	if (firstName && lastName && phone && password && tosAgreement) {
		// Make sure the user doesn't already exist
		_data.read('users', phone, function (err, data) {
			if (err) {
				// An error means file not found, Ready to add the user
				// First password need to be hashed before save
				let hashedPassword = helpers.hash(password);

				// Creating the user object
				var userObject = {
					'firstName': firstName,
					'lastName': lastName,
					'phone': phone,
					'password': hashedPassword,
					'tosAgreement': true
				};

				// Store the user
				_data.create('users', phone, userObject, function (err) {
					if (!err) {
						callback(200);
					} else {
						console.log(err);
						callback(500, {
							'Error': 'Could not create the new user'
						});
					}
				});

			} else {
				// user already exists
				callback(400, {
					'Error': 'A user is already exists'
				});
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing required fields'
		})
	}

};

// users - get
// Required : Phone,
// Optional : None
_users.get = function (data, callback) {
	var phone = typeof (data.query.phone) === 'string' && data.query.phone.trim().length === 10 ? data.query.phone : false;
	if (phone) {

		// Get the token from the header
		var token = (typeof(data.headers.token) === 'string') ? data.headers.token : false;
		// Verify the token
		verifyToken(token, phone, function(tokenIsValied){
			if(tokenIsValied) {
				// Lookup the user
				_data.read('users', phone, function (err, data) {
					if (!err && data) {
						// Remove the hashed password
						delete data.password;
						callback(200, data);
					} else {
						callback(404);
					}
			});
			} else {
				callback(403, {'Error' : 'Invalid token'});
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}
};

// users - put
// Required data : phone
// Optional data : firstName, LastName, password
_users.put = function (data, callback) {
	// Check for the required field
	var phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;

	// Check for the optional fields
	var firstName = (typeof (data.payload.firstName) === 'string') && (data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
	var lastName = (typeof (data.payload.lastName) === 'string') && (data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
	var password = (typeof (data.payload.password) === 'string') && (data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;

	if (phone) {
		if (firstName || lastName || password) {
			// Get the token from the header
			var token = (typeof(data.headers.token) === 'string') ? data.headers.token : false;
			// Verify the token
			verifyToken(token, phone, function(tokenIsValied){
				if(tokenIsValied) {
					_data.read('users', phone, function (err, userData) {
						if (!err && userData) {
							if (firstName) {
								userData.firstName = firstName;
							}
		
							if (lastName) {
								userData.lastName = lastName;
							}
		
							if (password) {
								userData.password = helpers.hash(password);
							}
		
							// Store the new updates
		
							_data.update('users', phone, userData, function (err) {
								if (!err) {
									callback(200);
								} else {
									console.log(err);
									callback(500, {
										'Error': 'Server Error'
									})
								}
							});
						} else {
							callback(400, {
								'Error': 'User is not exist'
							});
						}
					});
				} else {
					callback(403, {'Error' : 'Invalid token'});
				}
			});
		} else {
			callback(400, {
				'Error': 'Missing required fields'
			});
		}
	} else {
		callback(400, {
			'Error': 'Missing required fields'
		});
	}
};

// users - delete
// Required fields : phone
// TODO: Cleanup (delete) any other data files associated with this user
_users.delete = function (data, callback) {
	var phone = typeof (data.query.phone) === 'string' && data.query.phone.trim().length === 10 ? data.query.phone : false;
	if (phone) {
		// Get the token from the header
		var token = (typeof(data.headers.token) === 'string') ? data.headers.token : false;
		// Verify the token
		verifyToken(token, phone, function(tokenIsValied){
			if(tokenIsValied) {
				// Lookup the user
				_data.read('users', phone, function (err, data) {
					if (!err && data) {
						//Remove the user
						_data.delete('users', phone, function (err) {
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
							'Error': 'Could not find the user'
						});
					}
				});
			} else {
				callback(403, {'Error' : 'Invalid token'});
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}
};

module.exports = _users;
