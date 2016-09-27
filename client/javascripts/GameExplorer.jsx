import React, { PropTypes, Component } from 'react';
import Chart from 'chart.js';
import _ from 'lodash';
import Select from 'react-select';

class ActionGraph extends Component {
  constructor() {
    super();
  }

  componentWillReceiveProps() {
    if (this.chartObject) {
      console.log('destroying prior chart object');
      this.chartObject.destroy();
      this.chartObject = null;
    }
  }

  createChart(elt) {
    if (!elt)
      return;

    // creates a map from each value in an array to its index
    const invertArray = array => _.mapValues(_.invert(array), strIndex => parseInt(strIndex, 10));

    // always map the same action name to the same hue
    const getCharCodeSum = string => string.split('').reduce((acc, char) => (acc + char.charCodeAt(0)*char.charCodeAt(0)), 0);
    const getHueHash = string => getCharCodeSum(string) % 360;
    const getSatHash = string => ((getCharCodeSum(string) % 3) + 1) * 25;

    // We have to specify the radius of each bubble ourselves. We want it to represent how many times the action was played.
    // We'd rather not, say, double the radius if an action was played twice, and triple if it was played 3 times, because:
    // A) the circles would get HUMONGOUS really fast, like what if hoops plays 10 border villages or whatever?
    // B) the area of the circles would grow out of proportion with the action count. A circle with a radius of 2 has 4x the area of a circle with a radius of 1.
    // Solution: multiply the base radius by the square root of the action count, which will grow the area of the circle in proportion to the action count.
    const baseRadius = 9;
    const actionCountToRadius = count => baseRadius * Math.sqrt(count);

    const { data } = this.props;

    // Get a list of all action names used by this player, and sort them from most uses to least.
    // Then assign an index to each. (well, that happens automatically, bc that's how arrays work).
    const actionNames = _.uniq(_.flatten(data.map(turn => Object.keys(turn.actionCounts))));
    // Sort by negative numbers to get descending sort - we want the actions with the most plays to have the lowest id, so it's lowest on the graph
    // This doesn't work right. Why?
    const indexToActionName = _.sortBy(actionNames, actionName => (_.reduce(data, (accCount, turn) => (accCount + turn.actionCounts[actionName]), 0) * (-1)));
    const actionNameToIndex = invertArray(indexToActionName);

    // Do the same with turns as we did with actions - but this is a lot simpler, because we don't need to reorder them.
    const indexToTurnName = _.map(data, 'turnName');
    const turnNameToIndex = invertArray(indexToTurnName);

    // Plot a bubble for each kind of action played on each turn.
    const chartData = _.flatten(data.map(turn => _.map(turn.actionCounts, (actionCount, actionName) => ({
      x: turnNameToIndex[turn.turnName],
      y: actionNameToIndex[actionName],
      r: actionCountToRadius(actionCount),
    }))));

    // One dataset per action cuz this library is just OK
    const allDatasets = _.map(_.groupBy(chartData, 'y'), (actionData, actionIndex) => ({
      label: indexToActionName[actionIndex],
      data: actionData,
      backgroundColor: `hsl(${getHueHash(indexToActionName[actionIndex])}, ${getSatHash(indexToActionName[actionIndex])}%, 50%)`,
    }));

    const chartObject = new Chart(elt, {
      type: 'bubble',
      data: {
        datasets: allDatasets,
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              autoSkip: false,
              callback: (value, index) => indexToActionName[value],
              stepSize: 1,
            },
          }],
          xAxes: [{
            ticks: {
              autoSkip: false,
              callback: (value, index) => indexToTurnName[value],
              stepSize: 1,
            },
          }],
        },
        legend: {
          display: false,
        },
      },
    });

    // I'll fix this later, maybe
    this.chartObject = chartObject;
  }

  render() {
    if (this.canvasRef) {
      this.createChart(this.canvasRef);
    }

    return (
      <canvas
        width="600"
        height="200"
        ref={elt => {
          this.canvasRef = elt;
          this.createChart(elt);
        }}
      />
    );
  }
}

ActionGraph.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    turnName: PropTypes.string.isRequired,
    // hash from the name of the action to the # of times it was played on that turn
    actionCounts: PropTypes.objectOf(PropTypes.number).isRequired,
  })).isRequired,
};


class GameDetails extends Component {
  static generateActionGraphData(playByPlay, selectedPlayer) {
    // An array of the indexes of every turn that was played by this player (the playByPlay contains turns for all players ofc)
    const playerTurnIndexes = _.reduce(playByPlay, (acc, turn, index) => turn.player === selectedPlayer ? [...acc, index] : acc, []);

    // An array of arrays of "turn groups" - a turn group is like...all the turns that happens after the selected player finishes a turn,
    // and then the selected player's next turn. So if they played on turns 2 and 5, there would be turn groups of [ [turn1, turn2], [turn3, turn4, turn5] ]
    // Does that make sense??
    // We do this so we can capture all the actions they played on the entire round into a single "turn"
    // We have to do this because of weird cards like Caravan Guard that you can "play" when it's not your turn.
    const turnGroups = _.map(playerTurnIndexes, (turnIndex, index) => {
      const priorTurnIndex = playerTurnIndexes[index-1] ? (playerTurnIndexes[index-1] + 1) : 0;
      return playByPlay.slice(priorTurnIndex, turnIndex + 1);
    });

    // for each of these turn groups, get the # of each kind of action that was played, and stamp it with the name
    // of the last turn (the turn that was actually taken by the selectedPlayer)
    return _.map(turnGroups, tg => {
      const allActionPlays = _.flatten(_.map(tg, turn => {
        return _.filter(turn.happenings, h => h.happeningType === 'plays_action' && h.player === selectedPlayer);
      }));

      const groupedActionPlays = _.groupBy(allActionPlays, 'action');
      const actionCounts = _.fromPairs(_.map(groupedActionPlays, (groupedPlays, actionName) => [actionName, groupedPlays.length]));

      return {
        turnName: tg.slice(-1)[0].turn,
        actionCounts,
      };
    });
  }

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
      <div className="gameDetailsContainer">
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
        <div className="actionGraph">
          <h2>ACTION Graphs</h2>
          {
            _.map(game.playerList, player => (
              <div key={`${player}-${game.id}`}>
                <h3>For {player}:</h3>
                <ActionGraph
                  data={GameDetails.generateActionGraphData(game.playByPlay, player)}
                />
              </div>
            ))
          }
        </div>
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
  }),
};



export default class GameExplorer extends Component {
  constructor() {
    super();
    this.state = {
      selectedGameId: null,
      filters: {
        playerList: null,
        numPlayers: null,
        winners: null,
        supplyPiles: null,
      },
    };
  }

  handleSelectGame(value) {
    this.setState({ selectedGameId: value ? parseInt(value, 10) : null });
  }

  convertListToSelectOptions = (list) => {
    return list.map(item => ({label: item, value: item}) );
  }

  handleFilterChange = (list, filterKey) => {
    const filters = {
      ...this.state.filters,
      [filterKey]: list.map(item => item.value),
    };
    this.setState({ filters });
  }

  render() {
    const { games } = this.props;
    const { filters } = this.state;

    const filteredGames = games.filter((game) => {
      return (
        (filters.playerList ? _.intersection(game.playerList, filters.playerList).length === 0 : true) &&
        (filters.numPlayers ? game.playerList.length === filters.numPlayers : true) &&
        (filters.winners ? _.intersection(game.winners, filters.winners).length === 0 : true) &&
        (filters.supplyPiles ? _.intersection(game.supplyPiles, filters.supplyPiles).length === 0 : true)
      );
    });
    console.debug('filteredGames', filteredGames);
    console.debug('filters', filters);

    const selectedGame = this.state.selectedGameId ? _.find(filteredGames, { id: this.state.selectedGameId }) : null;

    const allPlayers = _.uniq(_.flatten(games.map(game => game.playerList)));
    const allNumPlayers = [1, 2, 3, 4];
    const allSupplyPiles = _.uniq(_.flatten(games.map(game => game.supplyPiles)));
    const allWinners = _.uniq(_.flatten(games.map(game => game.winners)));

    return (
      <div className="gameExplorer">
        <div className="gameExplorerHeader">
          <h1>Game Explorer</h1>
          <div className="gameExplorer-filters">
            <Select placeholder="Players" value={filters.playerList} options={this.convertListToSelectOptions(allPlayers)} onChange={(list) => this.handleFilterChange(list, 'playerList')} multi />
            <Select placeholder="Num Players" value={filters.numPlayers} options={this.convertListToSelectOptions(allNumPlayers)} onChange={(list) => this.handleFilterChange(list, 'numPlayers')} />
            <Select placeholder="Winners" value={filters.winners} options={this.convertListToSelectOptions(allWinners)} onChange={(list) => this.handleFilterChange(list, 'winners')} multi />
            <Select placeholder="Supply Piles" values={filters.supplyPiles} options={this.convertListToSelectOptions(allSupplyPiles)} onChange={(list) => this.handleFilterChange(list, 'supplyPiles')} multi />
          </div>
          <select
            onChange={e => this.handleSelectGame(e.target.value)}
            defaultValue=""
          >
            <option key="default" value="">Select a game</option>
            { filteredGames.map(g => <option key={g.id} value={g.id}>Game {g.id}</option>) }
          </select>
        </div>

        { selectedGame ? <GameDetails game={selectedGame} /> : null }
      </div>
    );
  }
}

GameExplorer.propTypes = {
  games: PropTypes.arrayOf(PropTypes.shape({

  })).isRequired,
};
