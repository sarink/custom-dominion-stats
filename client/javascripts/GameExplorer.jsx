window.App.GameExplorer = (function() {
  const { React, _ } = window;
  const { PropTypes, Component } = React;

  class GameDetails extends Component {
    render() {
      const { game } = this.props;

      const actionPlays = _.filter(_.flatten(_.map(game.playByPlay, 'happenings')), h => h.happeningType === 'plays_action');
      const groupedActionsByAction = _.groupBy(actionPlays, 'action');
      const mostPlayedAction = _.maxBy(Object.keys(groupedActionsByAction), action => groupedActionsByAction[action].length);
      const mostPlayedActionCount = (groupedActionsByAction[mostPlayedAction] || []).length;

      const actionsByPlayer = _.groupBy(actionPlays, 'player');
      const actionsByPlayerByAction = _.mapValues(actionsByPlayer, actionsForPlayer => _.groupBy(actionsForPlayer, 'action'));
      const favoriteActionByPlayer = _.mapValues(actionsByPlayerByAction, actionsByAction => {
        const favoriteAction = _.maxBy(Object.keys(actionsByAction), actionName => actionsByAction[actionName].length);
        const favoriteActionCount = actionsByAction[favoriteAction].length;
        return { action: favoriteAction, count: favoriteActionCount };
      });

      return (
        <div className="gameDetails">
          <h2>Game {game.id}</h2>
          <section>
            <div>Players</div>
            <div>{game.playerList.join(', ')}</div>
          </section>
          <section>
            <div>Winner(s)</div>
            <div>{game.winners.join(', ')}</div>
          </section>
          <section>
            <div>Scores</div>
            <div>
              <ul>
                {
                  _.map(game.scores, (score, player) => <li key={player}>{player}: {score}</li>)
                }
              </ul>
            </div>
          </section>
          <section>
            <div>Most played action</div>
            <div>
              {mostPlayedAction} ({mostPlayedActionCount} plays)
            </div>
          </section>
          <section>
            <div>Most played action by player</div>
            <div>
              <ul>
                {
                  _.map(favoriteActionByPlayer, (faveActionData, player) => (
                    <li key={player}>{player}: {faveActionData.action} ({faveActionData.count} plays)</li>
                  ))
                }
              </ul>
            </div>
          </section>
          <section>
            <div>Turn count</div>
            <div>{game.turnCount}</div>
          </section>
          <section>
            <div>Piles</div>
            <div>{ game.interestingSupplyPiles.join(', ') }</div>
          </section>
          {
            game.events.length > 0 ? (
              <section>
                <div>Events</div>
                <div>{game.events.join(', ')}</div>
              </section>
            ) : null
          }
        </div>
      );
    }
  }

  GameDetails.propTypes = {
    game: PropTypes.shape({
      rawData: PropTypes.shape({
        id: PropTypes.number.isRequired,
        raw_log: PropTypes.string.isRequired,
        log_url: PropTypes.string.isRequired,
        num_players: PropTypes.number.isRequired,
      }),
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
      const games = this.props.games;

      const selectedGame = this.state.selectedGameId ? _.find(this.props.games, { id: this.state.selectedGameId }) : null;

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
    games: PropTypes.arrayOf(PropTypes.shape({

    })).isRequired,
  };

  return GameExplorer;
}());
