window.App.Root = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;

  const getURLParameter = (name) => {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
  };

  let params = { playerNames: null, numPlayers: null };
  params = {
    playerNames: getURLParameter('playerNames'),
    numPlayers: getURLParameter('numPlayers'),
  };
  if (params.playerNames == null && params.numPlayers == null) {
    params = {
      playerNames: 'sarink,cherrypeel,nisse038',
      numPlayers: 3,
    };
  }
  params.devMode = getURLParameter('devMode');

  // For production:
  let BASE_URL = '/logs';

  const DEV_MODE_LOCAL = 'local';
  const DEV_MODE_PROD = 'prod';
  // For dev mode with production data (you can use different url parameters locally and they'll pass-through to the server):
  if (params.devMode === DEV_MODE_PROD) {
    BASE_URL = 'http://crossorigin.me/http://sarink.net:4000/logs';
    console.info(`devMode enabled and set to: ${DEV_MODE_PROD} - setting BASE_URL to ${BASE_URL}`);
  }
  // For dev mode with local sample data (NOTE: url parameters will not be taken into account):
  else if (params.devMode === DEV_MODE_LOCAL) {
    BASE_URL = '/sample_game_logs.json';
    console.info(`devMode enabled and set to: ${DEV_MODE_LOCAL} - setting BASE_URL to ${BASE_URL}`);
  }

  class Root extends Component {
    constructor() {
      super();
      this.state = {
        numPlayers: params.numPlayers,
        playerNames: params.playerNames,
        gameLogs: [],
      };
    }

    componentWillMount() {
      let url = `${BASE_URL}?`;
      if (this.state.numPlayers) url = `${url}&numPlayers=${this.state.numPlayers}`;
      if (this.state.playerNames) url = `${url}&playerNames=${this.state.playerNames}`;
      console.info(`fetching data from ${url}`);
      $.get(url).then((resp) => {
        console.info('success! game logs are available via: window.__gameLogs__');
        window.__gameLogs__ = resp;
        this.setState({gameLogs: resp});
      });
    }

    render() {
      const { gameLogs, playerNames } = this.state;
      const showGameExplorer = !_.isEmpty(gameLogs);
      const showLeaderboard = !_.isEmpty(playerNames) && !_.isEmpty(gameLogs);
      console.log('gameLogs', gameLogs);
      console.log('playerNames', playerNames);
      console.log('showLeaderboard', showLeaderboard);
      console.log('showGameExplorer', showGameExplorer);
      if (!showGameExplorer || !showLeaderboard) return <div>Loading...</div>;
      const { GameExplorer, Leaderboard } = window.App;
      return (
        <div>
          {showLeaderboard ? <window.App.Leaderboard highlightPlayers={playerNames} gameLogs={gameLogs} /> : null}
          <br /><hr />
          {showGameExplorer ? <GameExplorer gameLogs={gameLogs} /> : null}
        </div>
      );
    }
  }

  return Root;
}());
