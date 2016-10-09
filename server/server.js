(function(args) {
  var fs = require('fs');
  var _ = require('lodash');
  var express = require('express');
  var exec = require('child_process').exec;
  var crypto = require('crypto');
  var bodyParser = require('body-parser');
  var path = require('path');

  var db = require('./db');

  var REPO_ROOT = __dirname;
  var PORT = 4000;

  var app = express();
  app.listen(PORT);
  console.log('server.js running on port', PORT);

  const clientPath = path.resolve(__dirname, '../client');
  console.log(`server.js serving client files from ${clientPath}`);
  app.use(express.static(clientPath));

  // Enable CORS, once the /logs endpoint got too big crossorigin.me began truncating the response :(
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Using bodyParser allows us to read json from POSTs
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.post('/deploy-prod', function(req, res) {
    var payload = JSON.stringify(req.body);
    var githubSignature = req.headers['x-hub-signature'];
    var githubEvent = req.headers['x-github-event'];

    // The trim() on the end is crucial, otherwise the last character is a newline
    var secret  = fs.readFileSync(__dirname + '/github_hook_secret.txt', 'utf8').trim();

    // This sha1 is an hmac hex digest of the payload using our secret as the key
    var sha1 = 'sha1=' + crypto.createHmac('sha1', secret).update(payload).digest('hex');

    if (githubEvent === 'push') {
      res.sendStatus(200);
      console.log('signature matched for push event!');
      var cmd = 'cd ' + REPO_ROOT + ' && sudo git remote update && sudo git reset --hard origin/master && sudo git pull && npm install && node_modules/webpack/bin/webpack.js -p';
      exec(cmd);
    } else {
      console.log('signature did not match');
      res.sendStatus(403);
    }
  });

  app.get('/last_updated_stats', function(req, res) {
    var lastGitPull = fs.statSync(__dirname + '/../.git/FETCH_HEAD').mtime;
    var lastDbUpdate = fs.statSync(db.DB_FILE).mtime;
    var lastDbLogUrl = null;
    var stmt = 'SELECT * FROM ' + db.DB_TABLE + ' ORDER BY ' + db.DB_COL_LOG_URL + ' DESC LIMIT 1';
    db.instance.each(
      stmt,
      [],
      function callback(err, row) {
        lastDbLogUrl = row[db.DB_COL_LOG_URL];
      },
      function complete() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ lastDbLogUrl: lastDbLogUrl, lastGitPull: lastGitPull, lastDbUpdate: lastDbUpdate }));
      }
    );
  });

  app.get('/logs', function(req, res) {
    var playerNames = req.query.playerNames;
    var numPlayers = req.query.numPlayers;

    var stmt = (
      'SELECT * \
      FROM ' + db.DB_TABLE + ' \
      WHERE '
    );
    var params = [];

    var queryingByPlayerNames = playerNames != null;
    var queryingByNumPlayers = numPlayers != null;

    if (!queryingByNumPlayers && !queryingByPlayerNames) {
      stmt = stmt + '1 = 1';
    } else {
      if (queryingByNumPlayers) {
        stmt = stmt + db.DB_COL_NUM_PLAYERS + ' = ?';
        params.push(numPlayers);
      }

      if (queryingByPlayerNames) {
        if (queryingByNumPlayers) stmt = stmt + ' AND ';
        playerNames = playerNames.split(',');
        _.each(playerNames, function(player, index) {
          stmt = stmt + '(' + db.DB_COL_PLAYERS + ' LIKE ?) ';
          if (index < playerNames.length - 1) {
            stmt = stmt + ' AND ';
          }
        });
        params = params.concat(_.map(playerNames, function(player) { return '%'+player+'%'; }));
      }
    }

    var result = [];
    db.instance.each(
      stmt,
      params,
      function callback(err, row) {
        result.push(row);
      },
      function complete() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
      }
    );

  });
}(process.argv.slice(2)));
