// Dependencies
const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');
var utils = require('util');
var debug = utils.debuglog('server');

// Initiate the server object
var server = {}

server.httpServer = http.createServer(function (req, res) {

  // Parsing the URL with Query string
  var parsedUrl = url.parse(req.url, true);
  // console.log('Parsed with Query String', parsedUrl);

  // var parsedUrlWQ = url.parse(req.url, false);
  // console.log('Parsed without Query String', parsedUrlWQ);

  // Get the pathName from the request
  var path = parsedUrl.pathname;

  // Get the query string as object
  var queryString = parsedUrl.query;

  // Request method
  var method = req.method.toLowerCase();

  // Get the headers from the request as an object
  var headers = req.headers;

  // Trimmed the path
  var trimmedUrl = path.replace(/^\/+|\/+$/g, '');

  var buffer = '';
  var decoder = new StringDecoder('utf-8');

  req.on('data', (data) => {
    // buffer += data;
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();
    // console.log('Headers :', headers);
    // console.log('Buffer: ', buffer);
    // res.end(trimmedUrl + ' Method :' + req.method.toUpperCase() + ' Query : ' + queryString + '\n');
    // res.end(`${trimmedUrl}, Method: ${req.method.toUpperCase()}`);

    // Selecting the handler from the trimmedURL
    // Checking whether trimmedUrl is defined on the router object
    var chosenHandler = (typeof (server.router[trimmedUrl]) !== 'undefined') ? server.router[trimmedUrl] : handlers.notFound;

    // Defining the Data Object
    var data = {
      "trimmedPath": trimmedUrl,
      "headers": headers,
      "payload": helpers.parseJsonToObject(buffer),
      "method": method,
      "query": queryString
    };

    chosenHandler(data, function (statusCode, payload, contentType) {
      // Check the type of the content (fallback to json)
      contentType = typeof (contentType) === 'string' ? contentType : 'json';

      // Use the status code calledback by the handler or default to 200
      statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

      // Return the response parts that are content-specific
      var payloadString = '';
      if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof (payload) === 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof (payload) === 'string' ? payload : '';
      }
      
      // Return the response parts that are common to all content types
      res.writeHead(statusCode);
      res.end(payloadString);

      if (statusCode === 200) {
        debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedUrl + ' ' + statusCode)
      } else {
        debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedUrl + ' ' + statusCode)
      }
    });

  });
});

// Request router
server.router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/delete': handlers.accountDelete,
  'session/create': handlers.sessionCreate,
  'session/delete': handlers.sessionDelete,
  'checks/all': handlers.checkList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  'sampleRoute': handlers.sampleRoute,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks
};

server.init = function () {
  // Start the HTTP Server
  // @ts-ignore
  server.httpServer.listen(config.port, function () {
    // @ts-ignore
    console.log('\x1b[36m%s\x1b[0m', `Listening on: ${config.port}, ENV: ${config.envName}`);
  });
}

// Exporting the server module
module.exports = server;