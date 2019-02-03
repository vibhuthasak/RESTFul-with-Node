// Dependencies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

// Logging object
var lib = {}

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '../.logs/');

// Append a string to a file. Create the file if not exists
lib.append = function (file, str, callback) {
  // Open the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Append to the file and close it
      fs.appendFile(fileDescriptor, str + '\n', function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing file');
            }
          })
        } else {
          callback('Error appending to file');
        }
      })
    } else {
      callback('Could not open file for appending');
    }
  });
}

// List all the logs | optionally list including compressed files
lib.list = function (includeCompressedLogs, callback) {
  fs.readdir(lib.baseDir, function (err, data) {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(function (fileName) {
        // Add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        // Add on the .gz (Compressed) files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
}

// Compress the contents of one .log -> .gz.b64
lib.compress = function (logId, newFileId, callback) {
  var sourceFile = logId + '.log';
  var desFile = newFileId + '.gz.b64';

  // Read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf-8', function (err, inputString) {
    if (!err && inputString) {
      // Compress the data using gzip
      zlib.gzip(inputString, function (err, buffer) {
        if (!err && buffer) {
          // Send the data to the destination file
          fs.open(lib.baseDir + desFile, 'wx', function (err, fileDescriptor) {
            if (!err && fileDescriptor) {
              // Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), function (err) {
                if (!err) {
                  // Close the destination file
                  fs.close(fileDescriptor, function (err) {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        }
      });
    } else {
      callback(err);
    }
  });
}

// Decompress the contents .gz.b64 -> .logs
lib.decompress = function (fileId, callback) {
  var fileName = fileId + '.gz.b64';
  fs.readFile(lib.baseDir + fileName, 'utf-8', function (err, str) {
    if (!err && str) {
      // Decompress the data
      var inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, function(err, outBuffer){
        if(!err && outBuffer){
          // Callback
          callback(false, outBuffer.toString());
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
}

// Truncating the log file
lib.truncate = function(logId, callback) {
  fs.truncate(lib.baseDir+logId+'.log', 0, function(err){
    if(!err){
      callback(false);
    } else {
      callback(err);
    }
  })
}

// Export the module
module.exports = lib;