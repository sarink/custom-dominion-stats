window.App.Root = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;

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
      const { playerNames, numPlayers } = this.state;
      const url = `${BASE_URL}?numPlayers=${numPlayers}&playerNames=${playerNames}`;
      console.info(`fetching data from ${url}`);
      $.get(url).then((resp) => {
        this.setState({gameLogs: resp});
        console.info('success! game logs are available via: window.__gameLogs__');
        window.__gameLogs__ = resp;
      });
    }

    render() {
      const { playerNames, gameLogs } = this.state;
      return (
        <div>
          <window.App.Leaderboard playerNames={playerNames.split(',')} gameLogs={gameLogs} />
          <window.App.GameExplorer gameLogs={gameLogs} />
        </div>
      );
    }
  }

  return Root;
}());
