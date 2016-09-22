window.App.RootContainer = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;


  const getURLParameter = (name) => {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
  };

  const devMode = getURLParameter('devMode');

  // For production:
  let LOGS_URL = '/logs';
  let LAST_UPDATED_STATS_URL = '/last_updated_stats';

  const DEV_MODE_LOCAL = 'local';
  const DEV_MODE_PROD = 'prod';
  // For dev mode with production data (you can use different url parameters locally and they'll pass-through to the server):
  if (devMode === DEV_MODE_PROD) {
    LOGS_URL = 'http://sarink.net:4000/logs';
    LAST_UPDATED_STATS_URL = 'http://sarink.net:4000/last_updated_stats';
    console.info(`devMode enabled and set to: ${DEV_MODE_PROD} - setting LOGS_URL to ${LOGS_URL}`);
  }
  // For dev mode with local sample data (NOTE: url parameters will not be taken into account):
  else if (devMode === DEV_MODE_LOCAL) {
    LOGS_URL = '/sample_game_logs.json';
    console.info(`devMode enabled and set to: ${DEV_MODE_LOCAL} - setting LOGS_URL to ${LOGS_URL}`);
  }

  class RootContainer extends Component {
    constructor() {
      super();
      this.state = {
        loading: true,
        games: null,
        lastGitPull: null,
        lastDbUpdate: null,
      };
    }

    componentWillMount() {
      console.info(`fetching data from ${LOGS_URL}`);
      $.get(LOGS_URL).done((resp) => {
        const rawGamesArr = resp;
        const analyzedGames = {};
        rawGamesArr.forEach(game => analyzedGames[game.id] = window.App.GameAnalysis.analyzeGame(game));
        console.info('success! games have been analyzed and are available via: window.__games__');
        window.__games__ = analyzedGames;
        this.setState({games: analyzedGames});
      }).fail((resp) => {
        console.info('error loading!', resp);
      }).always(() => {
        this.setState({loading: false});
      });

      $.get(LAST_UPDATED_STATS_URL).then((resp) => {
        const { lastGitPull, lastDbUpdate, lastDbLogUrl } = resp;
        this.setState({ lastGitPull, lastDbUpdate, lastDbLogUrl });
      });
    }

    render() {
      const { loading, games, playerNames, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.state;

      if (loading) return <div>Loading...</div>;

      // Our components find it more convenient to deal with games as an array, so let's convert it for them
      const gamesArr = _.values(games);

      return (
        <window.App.Root
          allGames={gamesArr}
          lastGitPull={lastGitPull}
          lastDbUpdate={lastDbUpdate}
          lastDbLogUrl={lastDbLogUrl}
        />
      );
    }
  }

  return RootContainer;
}());
