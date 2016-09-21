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
  let LOGS_URL = '/logs';
  let LAST_UPDATED_STATS_URL = '/last_updated_stats';

  const DEV_MODE_LOCAL = 'local';
  const DEV_MODE_PROD = 'prod';
  // For dev mode with production data (you can use different url parameters locally and they'll pass-through to the server):
  if (params.devMode === DEV_MODE_PROD) {
    LOGS_URL = 'http://crossorigin.me/http://sarink.net:4000/logs';
    LAST_UPDATED_STATS_URL = 'http://crossorigin.me/http://sarink.net:4000/last_updated_stats';
    console.info(`devMode enabled and set to: ${DEV_MODE_PROD} - setting LOGS_URL to ${LOGS_URL}`);
  }
  // For dev mode with local sample data (NOTE: url parameters will not be taken into account):
  else if (params.devMode === DEV_MODE_LOCAL) {
    LOGS_URL = '/sample_game_logs.json';
    console.info(`devMode enabled and set to: ${DEV_MODE_LOCAL} - setting LOGS_URL to ${LOGS_URL}`);
  }



  class RootContainer extends Component {
    constructor() {
      super();
      this.state = {
        numPlayers: params.numPlayers,
        playerNames: params.playerNames,
        gameLogs: [],
        loading: true,
        lastGitPull: null,
        lastDbUpdate: null,
      };
    }

    componentWillMount() {
      let logsUrl = `${LOGS_URL}?`;
      if (this.state.numPlayers) logsUrl = `${logsUrl}&numPlayers=${this.state.numPlayers}`;
      if (this.state.playerNames) logsUrl = `${logsUrl}&playerNames=${this.state.playerNames}`;
      console.info(`fetching data from ${logsUrl}`);
      $.get(logsUrl).done((resp) => {
        const gameLogs = resp;
        const analyzedGameLogs = gameLogs.map(game => window.App.GameAnalysis.addAnalysis(game));
        console.info('success! game logs are available via: window.__gameLogs__');
        window.__gameLogs__ = analyzedGameLogs;
        const lastDbLogUrl = _.last(_.sortBy(analyzedGameLogs, 'log_url')).log_url;
        this.setState({gameLogs: analyzedGameLogs, lastDbLogUrl});
      }).fail((resp) => {
        console.info('error loading!', resp);
      }).always(() => {
        this.setState({loading: false});
      });

      $.get(LAST_UPDATED_STATS_URL).then((resp) => {
        const { lastGitPull, lastDbUpdate } = resp;
        this.setState({ lastGitPull, lastDbUpdate });
      });
    }

    render() {
      const { loading, gameLogs, playerNames, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.state;

      let content = null;

      if (loading) content = <div>Loading...</div>;

      const showGameExplorer = !_.isEmpty(gameLogs);
      const showLeaderboard = !_.isEmpty(playerNames) && !_.isEmpty(gameLogs);
      const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
      if (!showGameExplorer && !showLeaderboard) content = <div>Nothing to display :(</div>;

      content = (
        <div>
          {showLeaderboard ? <window.App.Leaderboard highlightPlayers={playerNames} gameLogs={gameLogs} /> : null}
          <br /><hr />
          {showGameExplorer ? <window.App.GameExplorer gameLogs={gameLogs} /> : null}
        </div>
      );

      return (
        <div>
          {showLastUpdatedStats ? <window.App.LastUpdatedStats lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
          {content}
        </div>
      );
    }
  }

  return RootContainer;
}());
