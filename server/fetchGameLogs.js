(function(dateStrings) {
  // here's the /etc/crontab listing to run this every 24 on my ubuntu 14 server:
  // sudo /home/sarink/.nvm/versions/node/v6.4.0/bin/node /var/www/custom-dominion-stats/server/fetchGameLogs.js

  var cheerio = require('cheerio');
  var Promise = require('bluebird');
  var request = require('request');
  var _ = require('lodash');
  var leftPad = require('left-pad');

  var db = require('./db');

  var MAX_CONCURRENT_AJAX_REQUESTS = 20;

  var exit = function() {
    db.instance.close();
    process.exit();
  };

  var doWeCareAboutThisGameLog = function(logBody) {
    if (_.isEmpty(logBody)) return false;
    return logBody.indexOf('sarink') !== -1 ||
           logBody.indexOf('nisse038') !== -1 ||
           logBody.indexOf('cherrypeel') !== -1 ||
           logBody.indexOf('lyra6969') !== -1 ||
           logBody.indexOf('gergesim') !== -1;
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
      console.log('fetching game log:', logUrl);
      request(logUrl, function(logError, logResponse, logBody) {
        if (!logError && doWeCareAboutThisGameLog(logBody)) {
          console.log('--relevant log found! inserting:', logUrl);
          saveGameLogToDb(logUrl, logBody);
        }
        resolve();
      });
    });
  };

  var downloadAndWriteRelevantGameLogsForDate = function(yyyymmdd) {
    var baseUrl = 'http://dominion-game-logs.s3.amazonaws.com/';
    var gameLogsUrl = baseUrl + yyyymmdd + '/index.html';

    console.log('fetching game logs for date:', yyyymmdd);
    return new Promise(function(resolve, reject) {
      request(gameLogsUrl, function(error, response, body) {
        var logUrls = [];

        var hasErrored = error || body.indexOf('<Error>') !== -1;
        if (!hasErrored) {
          var $ = cheerio.load(body);
          $('a').each(function() {
            var $a = $(this);
            var logUrl = $a.attr('href');
            if (logUrl.indexOf('://dominion-game-logs.s3.amazonaws.com/game_logs/') !== -1) {
              logUrls.push(logUrl);
            }
          });
          console.log('number of game logs for date ' + yyyymmdd + ':', logUrls.length);

          return resolve(Promise.map(logUrls, fetchGameLog, {concurrency: MAX_CONCURRENT_AJAX_REQUESTS}).then(function() {
            console.log('done fetching all game logs for date:', yyyymmdd);
            console.log('------------------------------------------------------------');
          }));

        } else {
          console.log('error fetching game log urls for date:', yyyymmdd);
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
    console.log('must pass an array of dateStrings in yyyymmdd format (ie, "node fetchAndSaveRelevantGameLogs.js \'20160721\' \'20160722\'")');
    exit();
  } else if (dateStrings[0] === 'seed') {
    console.log('seeding');
    dateStrings = [];
    for (var year = 2016; year <= 2016; year++) {
      var yearStr = year.toString();
      for (var month = 9; month <= 9; month++) {
        var monthStr = leftPad(month, 2, 0);
        for (var day = 1; day <= 20; day++ ) {
          var dayStr = leftPad(day, 2, 0);
          var dateString = yearStr + monthStr + dayStr;
          dateStrings.push(dateString);
        }
      }
    }
  }

  console.log('executing with dateStrings:', dateStrings);

  Promise.map(dateStrings, downloadAndWriteRelevantGameLogsForDate, {concurrency: 1}).then(function() {
    console.log('finished downloading and writing game logs for all dateStrings');
    exit();
  });
}(process.argv.slice(2)));
