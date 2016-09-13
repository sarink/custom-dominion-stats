(function(dateString) {

  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var cheerio = require('cheerio');
  var Promise = require('bluebird');
  var request = require('request');
  var _ = require('lodash');

  var MAX_CONCURRENT_AJAX_REQUESTS = 50;

  var writeGameLogToFile = function(dir, file, contents) {
    mkdirp(dir, function(errorCreatingDirectory) {
      if (errorCreatingDirectory) {
        console.log('error creating directory:', dir);
      } else {
        fs.writeFile(dir+file, contents, function(errorWritingFile) {
          if (errorWritingFile) {
            console.log('error writing file:', dir+file);
          } else {
            console.log('success! wrote file:', dir+file, contents);
          }
        });
      }
    });
  };

  var parseLogFileNameFromUrl = function(logUrl) {
    return logUrl.substr(logUrl.lastIndexOf('/') + 1);
  };

  var parseLogFileSaveDirFromUrl = function(logUrl) {
    return __dirname + logUrl.substr(logUrl.indexOf('/game_log'), logUrl.lastIndexOf('/') - logUrl.indexOf('/game_log')) + '/';
  };

  var doWeCareAboutThisGameLog = function(logBody) {
    if (_.isEmpty(logBody)) return false;
    return logBody.indexOf('sarink') !== -1 ||
           logBody.indexOf('nisse038') !== -1 ||
           logBody.indexOf('cherrypeel') !== -1;
  };

  var fetchGameLog = function(logUrl) {
    return new Promise(function(resolve, reject) {
      console.log('fetching game log:', logUrl);
      request(logUrl, function(logError, logResponse, logBody) {
        if (!logError && logBody && doWeCareAboutThisGameLog(logBody)) {
          var dir = parseLogFileSaveDirFromUrl(logUrl);
          var name = parseLogFileNameFromUrl(logUrl);
          writeGameLogToFile(dir, name, logBody);
        }
        resolve();
      });
    });
  };

  var downloadGameLogsForDate = function(yyyymmdd) {
    var baseUrl = 'http://dominion-game-logs.s3.amazonaws.com/';
    var gameLogsUrl = baseUrl + yyyymmdd + '/index.html';

    console.log('fetching game logs for date:', yyyymmdd);
    request(gameLogsUrl, function(error, response, body) {
      var logUrls = [];

      var hasErrored = error || body.indexOf('<Error>') !== -1;
      if (!hasErrored) {
        var $ = cheerio.load(body);
        $('a').each(function() {
          var $a = $(this);
          var logUrl = $a.attr('href');
          if (logUrl.indexOf('://dominion-game-logs.s3.amazonaws.com/game_logs/' + yyyymmdd) !== -1) {
            logUrls.push(logUrl);
          }
        });

        console.log('number of logs for date ' + yyyymmdd + ':', logUrls.length);

        Promise.map(logUrls, fetchGameLog, {concurrency: MAX_CONCURRENT_AJAX_REQUESTS,}).then(function() {
          console.log('done fetching all game log urls!');
        });

      } else {
        console.log('error fetching game log urls');
      }

    });
  };

  downloadGameLogsForDate(dateString);
}(process.argv.slice(2)[0]));
