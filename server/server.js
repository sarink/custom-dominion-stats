(function(args) {
  var fs = require('fs');
  var _ = require('lodash');
  var express = require('express');
  var exec = require('child_process').exec;
  var crypto = require('crypto');
  var bodyParser = require('body-parser');

  var db = require('./db');

  var REPO_ROOT = '/var/www/custom-dominion-stats';
  var PORT = 4000;

  var app = express();
  app.listen(PORT);
  console.log('server.js running on port', PORT);

  app.use(express.static(REPO_ROOT + '/client'));

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
      var cmd = 'cd ' + REPO_ROOT + ' && sudo git remote update && sudo git reset --hard origin/master && sudo git pull';
      exec(cmd);
    } else {
      console.log('signature did not match');
      res.sendStatus(403);
    }
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
