// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var http = require('http');
var https = require('https');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
var utils = require('util');
var debug = utils.debuglog('workers');

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
            debug("Error reading one of the check data");
          }
        });
      });
    } else {
      debug("Error: Could not find any checks to process");
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
    debug("Error Checks not properly formatted");
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
  
  // Log the outcome
  var timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, alertWanted, timeOfCheck);

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
        debug('Check has not changed, No alert needed');
      }
    } else {
      debug("Error trying to update new checkdata")
    }
  })
};

// Alert users to when status is changed
workers.alertUserToStatusChange = function(newCheckData){
  var message = 'Alert: Your check data for '+ newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
  helpers.sendTwilioSMS(newCheckData.userPhone, message, function(err){
    if(!err) {
      debug("User alerted");
    } else {
      debug("Could not send a SMS alert");
    }
  })
};

// Log workers
workers.log = function(originalCheckData, checkOutcome, checkstate, alertWanted, timeOfCheck){
  // Form the log data
  var logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': checkstate,
    'alert': alertWanted,
    'time': timeOfCheck
  }
  // Convert data to a string
  var logString = JSON.stringify(logData);

  // Determine the name of the log file
  var logFileName = logData.check.id;

  // Append the log string to the file
  _logs.append(logFileName, logString, function(err){
    if(!err){
      debug("Logging to file succeeded");
    } else {
      debug(err);
    }
  });
}

// Timer to execure all checks once per minute
workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 10)
}

// Compress the log file
workers.rotateLogs = function() {
  // List all the (non compressed) log files
  _logs.list(false, function(err, logs){
    if(!err && logs && logs.length > 0) {
      // Compress the data to a different file
      logs.forEach(function(logName){
        // Compress the data to a different file
        var logId = logName.replace('.log', '');
        var newFileId = logId+'-'+Date.now();
        _logs.compress(logId, newFileId, function(err){
          if(!err){
            // Truncate the log
            _logs.truncate(logId, function(err){
              if(!err){
                debug("Success truncating log file");
              } else {
                debug(err);
              }
            });
          } else {
            debug(err)
          }
        })
      })
    } else {
      debug("Error: Could not find any logs")
    }
  })
}

// Timer to execute the log-rotation process once per day
workers.logRotateLoog = function(){
  setInterval(function(){
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24)
}

// Init script
workers.init = function () {

  // Send to console, in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

  // Execute all the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();

  // Compress all the logs immediately
  workers.rotateLogs();

  // Compression loop for compress logs for every 24h
  workers.logRotateLoog();
}

// Export the module
module.exports = workers;