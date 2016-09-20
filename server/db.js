(function() {
  var fs = require('fs');
  var sqlite3 = require('sqlite3').verbose();

  var DB_FILE = __dirname + '/db/game_logs.sqlite';
  var DB_TABLE = 'game_logs';
  var DB_COL_ID = 'id';
  var DB_COL_PLAYERS = 'players';
  var DB_COL_RAW_LOG = 'raw_log';
  var DB_COL_LOG_URL = 'log_url';
  var DB_COL_NUM_PLAYERS = 'num_players';

  var dbExists = fs.existsSync(DB_FILE);
  if (!dbExists) {
    console.log('creating database', DB_FILE);
    fs.openSync(DB_FILE, 'w');
  }

  var db = new sqlite3.Database(DB_FILE);

  db.serialize(function() {
    if (!dbExists) {
      db.run('CREATE TABLE ' + DB_TABLE +
             ' (' + DB_COL_ID + ' INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    DB_COL_PLAYERS + ' TEXT, ' +
                    DB_COL_RAW_LOG + ' BLOB, ' +
                    DB_COL_LOG_URL + ' TEXT NOT NULL UNIQUE, ' +
                    DB_COL_NUM_PLAYERS + ' INTEGER ' + ')'
      );
      console.log('creating ' + DB_TABLE + ' table');
    }
  });

  module.exports = {
    DB_FILE: DB_FILE,
    DB_TABLE: DB_TABLE,
    DB_COL_ID: DB_COL_ID,
    DB_COL_PLAYERS: DB_COL_PLAYERS,
    DB_COL_RAW_LOG: DB_COL_RAW_LOG,
    DB_COL_LOG_URL: DB_COL_LOG_URL,
    DB_COL_NUM_PLAYERS: DB_COL_NUM_PLAYERS,
    instance: db,
  };
}());
