// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');

// Initiate the worker object
var workers = {};

// Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = function () {
  // Get all the checks
  _data.list('checks', function (err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(function (check) {
        _data.read('checks', check, function (err, originalCheckData) {
          if (!err && originalCheckData) {
            // Pass it to the check validator and let that function continue
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error reading one of the check data");
          }
        });
      });
    } else {
      console.log("Error: Could not find any checks to process");
    }
  })
}

// Sanity checking the check-data
workers.validateCheckData = function (originalCheckData) {
  originalCheckData = typeof (originalCheckData) === 'object' && originalCheckData != null ? originalCheckData : false;
  originalCheckData.id = typeof (originalCheckData.id) === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof (originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length === 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof (originalCheckData.protocol) === 'string' && (['http', 'https'].indexOf(originalCheckData.protocol) > -1) ? originalCheckData.protocol : false;
  originalCheckData.url = typeof (originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof (originalCheckData.method) === 'string' && (['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1) ? originalCheckData.method : false;
  originalCheckData.statusCodes = typeof (originalCheckData.statusCodes) === 'object' && originalCheckData.statusCodes instanceof Array && originalCheckData.statusCodes.length > 0 ? originalCheckData.statusCodes : false;
  originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

  // Set the keys that may not be set
  originalCheckData.state = typeof (originalCheckData.state) === 'string' && (['up', 'down'].indexOf(originalCheckData.state) > -1) ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all of checked pass, pass the data along to the next step in the process
  if (originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.statusCodes &&
    originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData);
  } else {
    console.log("Error Checks not properly formatted");
  }
}

// Perform the check, send the originalCheckData and the outcome of the checks
workers.performCheck = function(originalCheckData){
  // Prepare the initial checkoutcome
  var checkOutcome = {
    'error': false,
    'responseCode': false
  };

  // mark that the outcome has not been sent yet
  var outComeSent = false;

  // Parse the hostname and the path out of the original check data
  var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
  var hostname = parsedUrl.hostname;
  var path = parsedUrl.path;

  // Construct the request
  var requestDetails = {
    'protocol': originalCheckData.protocol+':',
    'hostname': hostname,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000
  }

  var _moduleToUse = originalCheckData.protocol === 'http' ? http : https;

  var req = _moduleToUse.request(requestDetails, function(response){
    // Grab the status of the sent request
    var status = response.statusCode;
    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if(!outComeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outComeSent = true;
    }
  });

  // Bind to a error
  req.on('error', function(error){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': error
    };
    if(!outComeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outComeSent = true;
    }
  });

  // Bind to a timeout event
  req.on('timeout', function(error){
    // Update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    };
    if(!outComeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outComeSent = true;
    }
  });

  // End the request
  req.end();
}

// Process the check outcome, update the check data as needed, trigger an alert to the user
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
  // Decide if the check is considered up or down
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.statusCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up': 'down';

  // Decide if an alert is wanted
  var alertWanted = originalCheckData.lastChecked && originalCheckData.state !== state ? true: false;

  // update the check data
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, function(err){
    if(!err) {
      if(alertWanted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check has not changed, No alert needed');
      }
    } else {
      console.log("Error trying to update new checkdata")
    }
  })
};

// Alert users to when status is changed
workers.alertUserToStatusChange = function(newCheckData){
  var message = 'Alert: Your check data for '+ newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
  helpers.sendTwilioSMS(newCheckData.userPhone, message, function(err){
    if(!err) {
      console.log("User alerted");
    } else {
      console.log("Could not send a SMS alert");
    }
  })
};

// Timer to execure all checks once per minute
workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 10)
}

// Init script
workers.init = function () {
  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();
}

// Export the module
module.exports = workers;