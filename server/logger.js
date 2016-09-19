(function() {
  var fs = require('fs');
  var util = require('util');

  var LOG_FILE = __dirname + '/logs/' + new Date().toISOString().slice(0, 16) + '-debug.log';

  var logFileStream = fs.createWriteStream(LOG_FILE, {flags : 'a',});
  var log = function() {
    logFileStream.write(util.format.apply(null, arguments) + '\n');
    process.stdout.write(util.format.apply(null, arguments) + '\n');
  };

  module.exports = {
    LOG_FILE: LOG_FILE,
    logFileStream: logFileStream,
    log: log,
  };
}());
