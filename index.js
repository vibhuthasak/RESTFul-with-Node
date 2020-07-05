// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app
const app = {};

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