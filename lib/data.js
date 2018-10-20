// Library for CRUD operations

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Defining the object that exports
const lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

// File Create Function
lib.create = function(dir, filename, data, callback) {
    // Open filename in wx+ mode for writing
    fs.open(lib.baseDir+dir+'/'+filename+'.json','wx', function(err, fileDescriptor){
        if(err) {
            callback('File creation error');
        } else if (!err && fileDescriptor) {
            // Convert Data to String
            const stringData = JSON.stringify(data);

            // Write the Data Buffer to the fileDescriptor
            fs.write(fileDescriptor, stringData, function(err){
               if(err) {
                   callback('Error in Writing the file');
               } else {
                   // Closing the file
                   fs.close(fileDescriptor, function(err){
                       if(err) {
                           callback('Save Error');
                       } else {
                           callback(false);
                       }
                   });
               }
            });
        }
    });
};

// File Read Function
lib.read = function(dir, fileName, callback){
    // Reading the file
    fs.readFile(lib.baseDir+dir+'/'+fileName+'.json', 'utf-8', function (err, data) {
      if (!err && data) {
          var parsedData = helpers.parseJsonToObject(data);
          callback(false, parsedData);
      } else {
          callback(err, data);
      }
    });
};

// File Update Function
lib.update = function(dir, fileName, data, callback) {
    // Open the file
    fs.open(lib.baseDir+dir+'/'+fileName+'.json', 'r+', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            var dataString = JSON.stringify(data);
            // Truncate the file
            fs.ftruncate(fileDescriptor, function(err){
                if(err) {
                    callback('Error in truncating');
                } else {
                    // Write the file
                    fs.writeFile(fileDescriptor, dataString, function (err) {
                        if(err) {
                            callback('File Write Err');
                        } else {
                            // Close the file
                            fs.close(fileDescriptor, function(err){
                                if(err){
                                    callback('Error closing the file');
                                } else {
                                    callback(false);
                                }
                            });
                        }
                    });

                }
            })

        } else {
            callback('Error Opening the file');
        }
    });
};

// File Delete Function
lib.delete = function(dir, filename, callback) {
    // unlink the file
    fs.unlink(lib.baseDir+dir+'/'+filename+'.json', function(err) {
        if (err) {
            callback('Error in Un linking the file ');
        } else {
            callback('File Deleted');
        }
    });
};

module.exports = lib;