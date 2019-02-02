// Dependencides
var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app
var app = {}

// Init function
app.init = function(){
  // Start the server
  server.init()

  // Start the worker
  workers.init()
}

// Execute
app.init()

// Exports the app
module.exports = app;