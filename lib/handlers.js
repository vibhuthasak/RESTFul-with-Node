// Request Handlers

const _data = require('./data');
const helpers = require('./helpers');

// Handlers object
const handlers = {};

//Users handler

handlers.users = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1 ) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405); // unauthorized method
    }
};

// Container for the users sub methods
handlers._users = {};

// users - post
// Required data : firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    var firstName = (typeof(data.payload.firstName) === 'string') && (data.payload.firstName.trim().length > 0) ? data.payload.firstName.trim() : false;
    var lastName = (typeof(data.payload.lastName) === 'string') && (data.payload.lastName.trim().length > 0) ? data.payload.lastName.trim() : false;
    var phone = (typeof(data.payload.phone) === 'string') && (data.payload.phone.trim().length === 10) ? data.payload.phone.trim() : false;
    var password = (typeof(data.payload.password) === 'string') && (data.payload.password.trim().length > 0) ? data.payload.password.trim() : false;
    var tosAgreement = (typeof(data.payload.tosAgreement) === 'boolean') && (data.payload.tosAgreement === true);

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesn't already exist
        _data.read('users', phone, function(err, data) {
           if(err) {
             // An error means file not found, Ready to add the user
             // First password need to be hashed before save
             let hashedPassword = helpers.hash(password);

             // Creating the user object
             var userObject = {
                'firstName': firstName,
                'lastName' : lastName,
                'phone' : phone,
                'password' : hashedPassword,
                'tosAgreement' : true
             };

             // Store the user
             _data.create('users', phone, userObject, function(err){
                if(!err) {
                    callback(200);
                } else {
                    console.log(err);
                    callback(500, {'Error' : 'Could not create the new user'});
                }
             });

           } else {
               // user already exists
             callback(400, {'Error' : 'A user is already exists'});
           }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'})
    }

};

// users - get
// Required : Phone,
// Optional : None
// TODO Only let an authorize user access their object
handlers._users.get = function(data, callback) {
    var phone = typeof(data.query.phone) === 'string' && data.query.phone.trim().length === 10 ? data.query.phone : false;
    if(phone) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
           if(!err && data) {
               // Remove the hashed password
             delete data.password;
             callback(200, data);
           } else {
               callback(404);
           }
        });
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// users - put
// TODO Only let an authorize user access their object
handlers._users.put = function(data, callback) {

};

// users - delete
handlers._users.delete = function(data, callback) {

};

// Add sampleRoute handler
handlers.sampleRoute = function(data, callback) {
    callback(200, {'route': 'Got the route'});
};

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

module.exports = handlers;