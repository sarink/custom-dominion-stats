window.App.Leaderboard = (function() {
  const { React, _ } = window;
  const { PropTypes, Component } = React;

  const logParser = (function() {
    const getPlaces = (log) => {
      let firstPlacePlayer, secondPlacePlayer, thirdPlacePlayer;
      const placeLines = _.compact(log.split('\n').map((line) => line.indexOf('place:') !== -1 ? line : null));
      placeLines.forEach((line) => {
        const playerName = line.substr(line.indexOf(': ') + 2);
        if (line.indexOf('1st place:') === 0) {
          firstPlacePlayer = playerName;
        } else if (line.indexOf('2nd place:') === 0) {
          secondPlacePlayer = playerName;
        } else if (line.indexOf('3rd place:') === 0) {
          thirdPlacePlayer = playerName;
        }
      });

      return {
        first: firstPlacePlayer,
        second: secondPlacePlayer,
        third: thirdPlacePlayer,
      };
    };

    return {
      getPlaces,
    };
  }());


  class PlayerWithPlaces extends Component {
    render() {
      const { highlightPlayer, playerName, firsts, seconds, thirds }  = this.props;
      return (
        <div className={`leaderboard-playerWithPlaces${-highlightPlayer ? 'highlightPlayer' : ''}`}>
          <h3>{playerName}</h3>
          Firsts: {firsts}<br/>
          Seconds: {seconds}<br/>
          Thirds: {thirds}
        </div>
      );
    }
  }
  PlayerWithPlaces.propTypes = {
    playerName: PropTypes.string.isRequired,
    firsts: PropTypes.number.isRequired,
    seconds: PropTypes.number.isRequired,
    thirds: PropTypes.number.isRequired,
    highlightPlayer: PropTypes.bool,
  };


  class Leaderboard extends Component {
    render() {
      let { highlightPlayers, games } = this.props;
      // TODO wtf is wrong with defaultProps?????
      highlightPlayers = highlightPlayers || '';

      const leaderboard = {};
      const newPlayerWithPlaces = { firsts: 0, seconds: 0, thirds: 0 };

      games.forEach((game) => {
        const { first, second, third } = logParser.getPlaces(game.rawData.raw_log);
        if (first) {
          leaderboard[first] = leaderboard[first] || Object.assign({}, newPlayerWithPlaces);
          leaderboard[first].firsts++;
        }
        if (second) {
          leaderboard[second] = leaderboard[second] || Object.assign({}, newPlayerWithPlaces);
          leaderboard[second].seconds++;
        }
        if (third) {
          leaderboard[third] = leaderboard[third] || Object.assign({}, newPlayerWithPlaces);
          leaderboard[third].thirds++;
        }
      });

      const sortedPlayers = _.reverse(_.sortBy(_.keys(leaderboard), (player) => leaderboard[player].firsts));

      return (
        <div className="leaderboard">
          <h1 className="leaderboard-title">Leaderboard</h1>
          {sortedPlayers.map((playerName) => {
            return (
              <PlayerWithPlaces
                key={playerName}
                playerName={playerName}
                firsts={leaderboard[playerName].firsts}
                seconds={leaderboard[playerName].seconds}
                thirds={leaderboard[playerName].thirds}
                highlightPlayer={highlightPlayers.indexOf(playerName) !== -1}
              />
            );
          })}
        </div>
      );
    }
  }
  Leaderboard.propTypes = {
    highlightPlayers: PropTypes.string,
    games: PropTypes.arrayOf(PropTypes.shape({

    })).isRequired,
  };

  return Leaderboard;
}());
