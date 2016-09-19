(function() {
  var fs = require('fs');
  var _ = require('lodash');
  var express = require('express');

  var db = require('./db');
  var logger = require('./logger');

  var PORT = 4000;
  var app = express();
  app.listen(PORT);
  console.log('app running on port', PORT);

  app.use(express.static('../client'));

  app.get('/logs', function(req, res) {
    var playerNames = req.query.playerNames;
    var numPlayers = req.query.numPlayers;
    logger.log('req query is', req.query);

    var stmt = (
      'SELECT * \
      FROM ' + db.DB_TABLE + ' \
      WHERE '
    );
    var params = [];

    var queryingByPlayerNames = playerNames != null;
    var queryingByNumPlayers = numPlayers != null;

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

    var result = [];
    logger.log('stmt', stmt);
    logger.log('params', params);
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
}());
