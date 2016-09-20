(function() {
  const React = window.React;
  const { PropTypes, Component } = React;
  const ReactDOM = window.ReactDOM;
  const $ = window.$;
  const _ = window._;


  const getURLParameter = (name) => {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
  };

  let params = {
    playerNames: getURLParameter('playerNames'),
    numPlayers: getURLParameter('numPlayers'),
  };
  if (params.playerNames == null || params.numPlayers == null) {
    params = {
      playerNames: 'sarink,cherrypeel,nisse038',
      numPlayers: 3,
    };
  }

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
      const { playerName, firsts, seconds, thirds }  = this.props;
      return (
        <div>
          <h3>{playerName}</h3>
          Firsts: {firsts}<br/>
          Seconds: {seconds}<br/>
          Thirds: {thirds}
          <hr/>
        </div>
      );
    }
  }
  PlayerWithPlaces.propTypes = {
    playerName: PropTypes.string.isRequired,
    firsts: PropTypes.number.isRequired,
    seconds: PropTypes.number.isRequired,
    thirds: PropTypes.number.isRequired,
  };


  class Leaderboard extends Component {
    render() {
      const { playerNames, gameLogs } = this.props;
      const leaderboard = {};
      playerNames.forEach((player) => {
        leaderboard[player] = {
          firsts: 0,
          seconds: 0,
          thirds: 0,
        };
      });
      gameLogs.forEach((log) => {
        const { first, second, third } = logParser.getPlaces(log.raw_log);
        if (first) leaderboard[first].firsts++;
        if (second) leaderboard[second].seconds++;
        if (third) leaderboard[third].thirds++;
      });
      const sortedPlayers = _.reverse(_.sortBy(playerNames, (player) => leaderboard[player].firsts));
      return (
        <div>
          <h1>Dominion Leaderboard</h1>
          {sortedPlayers.map((playerName) => {
            return (
              <PlayerWithPlaces
              key={playerName}
              playerName={playerName}
              firsts={leaderboard[playerName].firsts}
              seconds={leaderboard[playerName].seconds}
              thirds={leaderboard[playerName].thirds}
              />
            );
          })}
        </div>
      );
    }
  }
  Leaderboard.propTypes = {
    playerNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    gameLogs: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      players: PropTypes.string.isRequired,
      raw_log: PropTypes.string.isRequired,
      log_url: PropTypes.string.isRequired,
      num_players: PropTypes.number.isRequired,
    })),
  };


  class App extends Component {
    constructor() {
      super();
      this.state = {
        numPlayers: params.numPlayers,
        playerNames: params.playerNames,
        gameLogs: [],
      };
    }

    componentWillMount() {
      const baseUrl = '/logs';
      const { playerNames, numPlayers } = this.state;
      const url = `${baseUrl}?numPlayers=${numPlayers}&playerNames=${playerNames}`;
      $.get(url).then((resp) => {
        this.setState({gameLogs: resp});
      });
    }

    render() {
      const { playerNames, gameLogs } = this.state;
      return (
        <div>
          <Leaderboard playerNames={playerNames.split(',')} gameLogs={gameLogs} />
        </div>
      );
    }
  }

  ReactDOM.render(<App />, document.getElementById('app'));
}());
