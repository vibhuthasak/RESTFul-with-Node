const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('./config');

const server = http.createServer(function(req, res) {

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
  var method = req.method.toUpperCase();

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
    var chosedHandler = (typeof(router[trimmedUrl]) !== 'undefined') ? router[trimmedUrl] : handlers.notFound;

    // Defining the Data Object
    var data = {
      "trimmedPath": trimmedUrl,
      "headers": headers,
      "payload": buffer,
      "method": method,
      "query": queryString
    };

    chosedHandler(data, function(statusCode = 200, payload = {}){
      var payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'JSON');
      res.writeHead(statusCode);
      res.end(payloadString);
    });

  });
});

server.listen(config.port, function(){
  console.log(`Listening on: ${config.port}, ENV: ${config.envName}`);
});


// Handlers object
const handlers = {};

// Add sampleRoute handler 
handlers.sampleRoute = function(data, callback) {
  callback(200, {'route': 'Got the route'});
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Request router
const router = {
  'sampleRoute': handlers.sampleRoute
};
