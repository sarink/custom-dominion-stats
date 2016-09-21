window.App.GameAnalysis = (function() {
  const _ = window._;

  // The Javascript API sucks really badly.
  // Call exec on the given regex, supplying the targetString, until no more matches are found.
  // Return all the matches.
  // Be sure to pass the 'g' flag to the supplied regex.
  const regexExecAll = (regex, targetString) => {
    let results = [];
    let regexResult;
    while (regexResult = regex.exec(targetString)) { // eslint-disable-line no-cond-assign
      results.push(regexResult);
    }

    return results;
  };

  // Returns the names of the player in an array
  const getPlayers = game => game.players.split(',');

  // Returns the names of the winner or winners in an array
  const getWinners = game => {
    var firstPlace = /1st place: (\w+)\n/g;
    return regexExecAll(firstPlace, game.raw_log).map(match => match[1]);
  };

  // Returns an array of the names of the events in the game - empty if none
  const getEvents = game => {
    const matchResult = game.raw_log.match(/Events: (.*?)\n/);
    return matchResult ? matchResult[1].split(', ') : [];
  };

  // Returns an array of the names of the supply piles in the game - includes coppers, estates, etc
  const getSupplyPiles = game => game.raw_log.match(/Supply cards: (.*?)\n/)[1].split(', ');

  const excludeBoringPiles = piles => _.difference(piles, ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse']);

  // Returns a hash of player's names to their final score
  const getScores = game => {
    // This is lame perf thing, I just don't see why we should search through the entire log when
    // we know the points always comes after the "game over" marker
    const gameOverMarker = '------------ Game Over ------------';
    const log = game.raw_log;
    const gameResultsIndex = log.indexOf(gameOverMarker) + gameOverMarker.length;
    const gameResults = log.substring(gameResultsIndex);

    const players = getPlayers(game);
    return _.fromPairs(players.map(player => {
      const scoreFinder = new RegExp(`${player} - total victory points: (.*?)\n`);
      const score = parseInt(log.match(scoreFinder)[1], 10);
      return [player, score];
    }));
  };

  // Find the number of turns in the game
  // (by finding the turn with the highest number)
  const getTurnCount = game => {
    const turnRegex = /: turn (\d+) ---/g;
    const turnNumbers = regexExecAll(turnRegex, game.raw_log).map(match => parseInt(match[1], 10));
    return _.max(turnNumbers);
  };

  // Expects a game object with
  const addAnalysis = game => {
    return Object.assign(
      {},
      game,
      {
        // an 'analyzed' flag might be useful later if we want to delay analysis
        // until a game is selected (or something).
        analyzed: true,
        playerList: getPlayers(game),
        winners: getWinners(game),
        scores: getScores(game),
        supplyPiles: getSupplyPiles(game),
        interestingSupplyPiles: excludeBoringPiles(getSupplyPiles(game)),
        events: getEvents(game),
        turnCount: getTurnCount(game)
      }
    );
  };

  return {
    addAnalysis
  };
})();
