window.App.GameExplorer = (function() {
  const { React, _ } = window;
  const { PropTypes, Component } = React;

  class GameDetails extends Component {
    render() {
      const { game } = this.props;

      return (
        <div>
          <h2>Game {game.id}</h2>
          <div>
            <h3>Players</h3>
            {game.playerList.join(', ')}
          </div>
          <div>
            <h3>Winner(s)</h3>
            {game.winners.join(', ')}
          </div>
          <div>
            <h3>Scores</h3>
            <ul>
              {
                _.map(game.scores, (score, player) => <li key={player}>{player}: {score}</li>)
              }
            </ul>
          </div>
          <h3>Turn count: {game.turnCount}</h3>
          <div>
            <h3>Piles</h3>
            { game.interestingSupplyPiles.join(', ') }
          </div>
          {
            game.events.length > 0 ? (
              <div>
                <h3>Events</h3>
                {game.events.join(', ')}
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

  return GameExplorer;
}());
