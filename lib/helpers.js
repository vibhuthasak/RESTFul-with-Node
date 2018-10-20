// Helpers for various tasks

// Dependencies
const crypto = require('crypto');
const config = require('../config');

// Container for all helpers file
var helpers = {};

// helpers.hash
helpers.hash = function (str) {
	if (typeof (str) === 'string' && str.length > 0) {
		return crypto.createHash('sha256', config.hashingSecret).update(str).digest('hex');
	} else {
		return false;
	}
};

// helpers.parseJsonToObject
// Parse a JSON string to an object in all cases, without throwing a error
helpers.parseJsonToObject = function (str) {
	try {
		return JSON.parse(str);
	} catch (e) {
		return {}
	}
};

// create random string of x length
helpers.createRandomString = function (strLength) {
	strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
	if (strLength) {
		var possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

		// Start of the final string
		var str = '';
		
		for (i=1; i <= strLength; i++) {
			// get a random char from possibleChars 
			var randomCharactor = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
			// append randomCharactor to str
			str += randomCharactor;
		}
		// Output the str
		return str;
	} else {
		return false;
	}
};

// Exporting the module
module.exports = helpers;