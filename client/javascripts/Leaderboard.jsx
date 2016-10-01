import React, { PropTypes, Component } from 'react';
import _ from 'lodash';

import Select from 'react-select';
import Avatar from 'javascripts/Avatar';

import styles from './Leaderboard.scss';

// Any games with less than this number of turns won't be counted when computing the leaderboard
const MIN_NUM_TURNS_THRESHOLD = 4;


class PlayerWithPlaces extends Component {
  static propTypes = {
    playerName: PropTypes.string.isRequired,
    firsts: PropTypes.number.isRequired,
    seconds: PropTypes.number.isRequired,
    thirds: PropTypes.number,
    fourths: PropTypes.number,
  }

  render() {
    const { index, playerName, firsts, seconds, thirds, fourths }  = this.props;

    return (
      <div className={styles.playerWithPlaces}>
        <span className={styles.playerWithPlacesIndex}>{index}.</span>
        <Avatar playerName={playerName} />
        <div className={styles.playerWithPlacesStats}>
          Firsts: {firsts}<br/>
          Seconds: {seconds}<br/>
          {thirds != null ? `Thirds: ${thirds}` : null}
          {fourths != null ? `Fourths: ${fourths}` : null}
        </div>
      </div>
    );
  }
}


export default class Leaderboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerList: props.initialPlayerList,
    };
  }

  static defaultProps = {
    initialPlayerList: [],
  }

  static propTypes = {
    initialPlayerList: PropTypes.arrayOf(PropTypes.string),
    games: PropTypes.arrayOf(PropTypes.shape({
      playerList: PropTypes.arrayOf(PropTypes.string).isRequired,
      scores: PropTypes.object.isRequired,
    })).isRequired,
  }

  handlePlayerListFilterChange = (selectedPlayerList) => {
    this.setState({ playerList: selectedPlayerList.map(player => player.value) });
  }

  convertPlayerListToSelectOptions = (playerList) => {
    return playerList.map(player => ({label: player, value: player}) );
  }

  render() {
    const { games, initialPlayerList } = this.props;
    const { playerList } = this.state;

    const placeIndexToPlaceName = {
      0: 'firsts',
      1: 'seconds',
      2: 'thirds',
      3: 'fourths',
    };

    // Build an initial `leaderboard` object where the key is the player name and the value is a place count object
    // ex: { playerName: { firsts: 0, seconds: 0, thirds: 0, ... } }
    const leaderboard = _.fromPairs(playerList.map((player) => {
      const val = _.fromPairs(playerList.map((player, placeIndex) => [placeIndexToPlaceName[placeIndex], 0] ));
      return [player, val];
    }));

    // Filter out games that don't have our players in them or don't meet the minimum turn threshold
    const filteredGames = games.filter(game =>
      game.analyzed &&
      game.turnCount > MIN_NUM_TURNS_THRESHOLD &&
      game.playerList.length === playerList.length &&
      _.difference(game.playerList, playerList).length === 0
    );

    // Populate the `leaderboard` object
    filteredGames.forEach(game => {
      game.places.forEach((players, placeIndex) => {
        const placeName = placeIndexToPlaceName[placeIndex];
        players.forEach(player => {
          leaderboard[player][placeName]++;
        });
      });
    });

    // Build an array of each playerName, sorted by the amount of 'firsts' they have in the `leaderboard`
    const winningPlaceName = placeIndexToPlaceName[0];
    const playersSortedByScore = _.reverse(_.sortBy(_.keys(leaderboard), player => leaderboard[player][winningPlaceName]));

    // Get a list of all players from our games, then build options for reaect-select like: [{label: 'player', value: 'player'}]
    const allPlayers = _.uniq(_.flatten(games.map(game => game.playerList)));
    const playerListOptions = this.convertPlayerListToSelectOptions(allPlayers);

    return (
      <div className={styles.leaderboard}>
        <h1 className={styles.title}>Leaderboard</h1>
        <div className={styles.filters}>
          <span>(automatically ignoring games with less than {MIN_NUM_TURNS_THRESHOLD} turns)</span>
          <Select
            value={playerList}
            resetValue={this.convertPlayerListToSelectOptions(initialPlayerList)}
            options={playerListOptions}
            onChange={this.handlePlayerListFilterChange}
            multi
            autoBlur
          />
          <br/>
        </div>
        {!_.isEmpty(filteredGames)
          ? playersSortedByScore.map((playerName, index) => {
            return (
              <PlayerWithPlaces
                index={index+1}
                key={playerName}
                playerName={playerName}
                firsts={leaderboard[playerName].firsts}
                seconds={leaderboard[playerName].seconds}
                thirds={leaderboard[playerName].thirds}
                fourths={leaderboard[playerName].fourths}
              />
            );
          })
          : 'No matching games found :('
        }
      </div>
    );
  }
}
