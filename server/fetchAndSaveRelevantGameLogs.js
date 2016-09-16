(function(dateStrings) {
  // here's the /etc/crontab listing to run this every 24 on my ubuntu 14 server:
  // sudo /home/sarink/.nvm/versions/node/v6.4.0/bin/node /var/www/custom-dominion-stats/server/fetchAndSaveRelevantGameLogs.js

  var fs = require('fs');
  var cheerio = require('cheerio');
  var Promise = require('bluebird');
  var request = require('request');
  var _ = require('lodash');
  var leftPad = require('left-pad');
  var util = require('util');
  var sqlite3 = require('sqlite3').verbose();


  var LOG_FILE = __dirname + '/' + new Date().toISOString().slice(0, 10) + '-debug.log';
  var logFileStream = fs.createWriteStream(LOG_FILE, {flags : 'a',});
  var log = function() {
    logFileStream.write(util.format.apply(null, arguments) + '\n');
    process.stdout.write(util.format.apply(null, arguments) + '\n');
  };


  var DB_FILE = __dirname + '/db/game_logs.sqlite';
  var DB_TABLE = 'game_logs';
  var DB_COL_ID = 'id';
  var DB_COL_PLAYERS = 'players';
  var DB_COL_RAW_LOG = 'raw_log';
  var DB_COL_LOG_URL = 'log_url';
  var dbExists = fs.existsSync(DB_FILE);
  if (!dbExists) {
    log('creating database', DB_FILE);
    fs.openSync(DB_FILE, 'w');
  }
  var db = new sqlite3.Database(DB_FILE);


  var exit = function() {
    logFileStream.close();
    db.close();
    process.exit();
  };


  var MAX_CONCURRENT_AJAX_REQUESTS = 20;


  db.serialize(function() {
    if (!dbExists) {
      db.run('CREATE TABLE ' + DB_TABLE +
             ' (' + DB_COL_ID + ' INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    DB_COL_PLAYERS + ' TEXT, ' +
                    DB_COL_RAW_LOG + ' BLOB, ' +
                    DB_COL_LOG_URL + ' TEXT' + ')'
      );
    }

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
      var stmt = db.prepare(
        'INSERT INTO ' + DB_TABLE +
        ' (' + DB_COL_PLAYERS + ', ' + DB_COL_RAW_LOG + ', ' + DB_COL_LOG_URL + ')' +
        ' VALUES (?, ?, ?)'
      );
      var players = parsePlayerNamesFromLog(logBody);
      stmt.run([players.join(','), logBody, logUrl,]);
      return stmt.finalize();
    };

    var fetchGameLog = function(logUrl) {
      return new Promise(function(resolve, reject) {
        log('fetching game log:', logUrl);
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

      log('fetching game logs for date:', yyyymmdd);
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
            log('number of game logs for date ' + yyyymmdd + ':', logUrls.length);

            return resolve(Promise.map(logUrls, fetchGameLog, {concurrency: MAX_CONCURRENT_AJAX_REQUESTS,}).then(function() {
              log('done fetching all game logs for date:', yyyymmdd);
              log('------------------------------------------------------------');
            }));

          } else {
            log('error fetching game log urls for date:', yyyymmdd);
          }
        });
      });
    };

    if (_.isEmpty(dateStrings)) {
      var dayBeforeYesterday = new Date();
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
      var yyyymmddDayBeforeYesterday = dayBeforeYesterday.toISOString().slice(0, 10).replace(/-/g, '');
      dateStrings = [yyyymmddDayBeforeYesterday,];
    } else if (!_.isArray(dateStrings)) {
      log('must pass an array of dateStrings in yyyymmdd format (ie, "node fetchAndSaveRelevantGameLogs.js \'20160721\' \'20160722\'")');
      exit();
    }

    log('executing with dateStrings:', dateStrings);

    Promise.map(dateStrings, downloadAndWriteRelevantGameLogsForDate, {concurrency: 1,}).then(function() {
      log('finished downloading and writing game logs for all dateStrings');
      exit();
    });
  });
}(process.argv.slice(2)));
