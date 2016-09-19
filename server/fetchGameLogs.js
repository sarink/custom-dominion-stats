(function(dateStrings) {
  // here's the /etc/crontab listing to run this every 24 on my ubuntu 14 server:
  // sudo /home/sarink/.nvm/versions/node/v6.4.0/bin/node /var/www/custom-dominion-stats/server/fetchAndSaveRelevantGameLogs.js

  var cheerio = require('cheerio');
  var Promise = require('bluebird');
  var request = require('request');
  var _ = require('lodash');

  var db = require('./db');
  var logger = require('./logger');

  var MAX_CONCURRENT_AJAX_REQUESTS = 20;

  var exit = function() {
    logger.logFileStream.close();
    db.instance.close();
    process.exit();
  };

  var doWeCareAboutThisGameLog = function(logBody) {
    if (_.isEmpty(logBody)) return false;
    return logBody.indexOf('sarink') !== -1 ||
           logBody.indexOf('nisse038') !== -1 ||
           logBody.indexOf('cherrypeel') !== -1;
  };

  var parsePlayerNamesFromLog = function(logBody) {
    var placeLines = _.compact(_.map(logBody.split('\n'), function(line) {
      return (line.indexOf('place:') !== -1) ? line : null;
    }));
    var playerNames = _.map(placeLines, function(line) {
      return line.substr(line.indexOf(': ') + 2);
    });
    return playerNames;
  };

  var saveGameLogToDb = function(logUrl, logBody) {
    var stmt = db.instance.prepare(
      'INSERT OR REPLACE INTO ' + db.DB_TABLE +
      ' (' + db.DB_COL_PLAYERS + ', ' + db.DB_COL_RAW_LOG + ', ' + db.DB_COL_LOG_URL + ', ' + db.DB_COL_NUM_PLAYERS + ')' +
      ' VALUES (?, ?, ?, ?)'
    );
    var players = parsePlayerNamesFromLog(logBody);
    stmt.run([players.join(','), logBody, logUrl, players.length]);
    return stmt.finalize();
  };

  var fetchGameLog = function(logUrl) {
    return new Promise(function(resolve, reject) {
      logger.log('fetching game log:', logUrl);
      request(logUrl, function(logError, logResponse, logBody) {
        if (!logError && doWeCareAboutThisGameLog(logBody)) {
          saveGameLogToDb(logUrl, logBody);
        }
        resolve();
      });
    });
  };

  var downloadAndWriteRelevantGameLogsForDate = function(yyyymmdd) {
    var baseUrl = 'http://dominion-game-logs.s3.amazonaws.com/';
    var gameLogsUrl = baseUrl + yyyymmdd + '/index.html';

    logger.log('fetching game logs for date:', yyyymmdd);
    return new Promise(function(resolve, reject) {
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
          logger.log('number of game logs for date ' + yyyymmdd + ':', logUrls.length);

          return resolve(Promise.map(logUrls, fetchGameLog, {concurrency: MAX_CONCURRENT_AJAX_REQUESTS}).then(function() {
            logger.log('done fetching all game logs for date:', yyyymmdd);
            logger.log('------------------------------------------------------------');
          }));

        } else {
          logger.log('error fetching game log urls for date:', yyyymmdd);
        }
      });
    });
  };

  if (_.isEmpty(dateStrings)) {
    var dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    var yyyymmddDayBeforeYesterday = dayBeforeYesterday.toISOString().slice(0, 10).replace(/-/g, '');
    dateStrings = [yyyymmddDayBeforeYesterday];
  } else if (!_.isArray(dateStrings)) {
    logger.log('must pass an array of dateStrings in yyyymmdd format (ie, "node fetchAndSaveRelevantGameLogs.js \'20160721\' \'20160722\'")');
    exit();
  }

  logger.log('executing with dateStrings:', dateStrings);

  Promise.map(dateStrings, downloadAndWriteRelevantGameLogsForDate, {concurrency: 1}).then(function() {
    logger.log('finished downloading and writing game logs for all dateStrings');
    exit();
  });
}(process.argv.slice(2)));
