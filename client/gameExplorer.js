const React = window.React;
const { PropTypes, Component } = React;
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

class GameDetails extends Component {
  render() {
    const { game } = this.props;

    const events = getEvents(game);
    const supplyPiles = getSupplyPiles(game);

    return (
      <div>
        <h2>Game {game.id}</h2>
        <div>
          <h3>Players</h3>
          {getPlayers(game).join(', ')}
        </div>
        <div>
          <h3>Winner(s)</h3>
          {getWinners(game).join(', ')}
        </div>
        <div>
          <h3>Scores</h3>
          <ul>
            {
              _.map(getScores(game), (score, player) => <li key={player}>{player}: {score}</li>)
            }
          </ul>
        </div>
        <h3>Turn count: {getTurnCount(game)}</h3>
        <div>
          <h3>Piles</h3>
          { excludeBoringPiles(supplyPiles).join(', ') }
        </div>
        {
          events.length > 0 ? (
            <div>
              <h3>Events</h3>
              {events.join(', ')}
            </div>
          ) : null
        }
      </div>
    );
  }
}

GameDetails.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.number.isRequired,
    players: PropTypes.string.isRequired,
    raw_log: PropTypes.string.isRequired,
    log_url: PropTypes.string.isRequired,
    num_players: PropTypes.number.isRequired,
  })
};



class GameExplorer extends Component {
  constructor() {
    super();
    this.state = {
      selectedGameId: null,
    };
  }

  handleSelectGame(value) {
    this.setState({ selectedGameId: value ? parseInt(value, 10) : null });
  }

  render() {
    const games = this.props.gameLogs;

    const selectedGame = this.state.selectedGameId ? _.find(this.props.gameLogs, { id: this.state.selectedGameId }) : null;

    return (
      <div>
        <h1>Game Explorer</h1>
        <select
          onChange={e => this.handleSelectGame(e.target.value)}
          defaultValue=""
        >
          <option key="default" value="">Select a game</option>
          { games.map(g => <option key={g.id} value={g.id}>Game {g.id}</option>) }
        </select>

        { selectedGame ? <GameDetails game={selectedGame} /> : null }
      </div>
    );
  }
}

GameExplorer.propTypes = {
  gameLogs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    players: PropTypes.string.isRequired,
    raw_log: PropTypes.string.isRequired,
    log_url: PropTypes.string.isRequired,
    num_players: PropTypes.number.isRequired,
  })),
};
