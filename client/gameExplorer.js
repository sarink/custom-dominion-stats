const React = window.React;
const { PropTypes, Component } = React;
const _ = window._;

// Returns the names of the player in an array
const getPlayers = game => game.players.split(',');

// Returns the names of the winner or winners in an array
const getWinners = game => {
  var firstPlace = /1st place: (\w+)\n/g;
  const winners = [];
  let regexResult;
  while (regexResult = firstPlace.exec(game.raw_log)) { // eslint-disable-line no-cond-assign
    winners.push(regexResult[1]);
  }

  return winners;
};

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

  renderGame(gameId) {
    const game = _.find(this.props.gameLogs, { id: gameId });

    return (
      <div>
        <h2>Game {gameId}</h2>
        <p>Players: {getPlayers(game).join(', ')}</p>
        <p>Winner(s): {getWinners(game).join(', ')}</p>
        <p>Scores:
          <ul>
            {
              _.map(getScores(game), (score, player) => <li key={player}>{player}: {score}</li>)
            }
          </ul>
        </p>
      </div>
    );
  }

  render() {
    const games = this.props.gameLogs;

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

        { this.state.selectedGameId ? this.renderGame(this.state.selectedGameId) : null }
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
