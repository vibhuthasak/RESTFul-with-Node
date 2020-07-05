// Dependencies
const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('../config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const utils = require('util');
const debug = utils.debuglog('server');

// Initiate the server object
const server = {};

server.httpServer = http.createServer(function (req, res) {

  // Parsing the URL with Query string
  const parsedUrl = url.parse(req.url, true);
  // console.log('Parsed with Query String', parsedUrl);

  // var parsedUrlWQ = url.parse(req.url, false);
  // console.log('Parsed without Query String', parsedUrlWQ);

  // Get the pathName from the request
  const path = parsedUrl.pathname;

  // Get the query string as object
  const queryString = parsedUrl.query;

  // Request method
  const method = req.method.toLowerCase();

  // Get the headers from the request as an object
  const headers = req.headers;

  // Trimmed the path
  const trimmedUrl = path.replace(/^\/+|\/+$/g, '');

  let buffer = '';
  const decoder = new StringDecoder('utf-8');

  req.on('data', (data) => {
    // buffer += data;
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Selecting the handler from the trimmedURL
    // Checking whether trimmedUrl is defined on the router object
    const chosenHandler = (typeof (server.router[trimmedUrl]) !== 'undefined') ? server.router[trimmedUrl] : handlers.notFound;

    // Defining the Data Object
    const data = {
      "trimmedPath": trimmedUrl,
      "headers": headers,
      "payload": helpers.parseJsonToObject(buffer),
      "method": method,
      "query": queryString
    };

    chosenHandler(data, function (statusCode, payload, contentType) {
      // Check the type of the content (fallback to json)
      contentType = typeof (contentType) === 'string' ? contentType : 'json';

      // Use the status code callback by the handler or default to 200
      statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

      // Return the response parts that are content-specific
      let payloadString = '';
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