window.App.Root = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;

  // TODO we can't require the components this way, I guess, bc faux modules
  const { GameAnalysis } = window.App;


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
        numPlayers: null,
        playerNames: null,
        games: {},
        loading: true,
        lastGitPull: null,
        lastDbUpdate: null,
      };
    }

    componentWillMount() {
      console.info(`fetching data from ${LOGS_URL}`);
      $.get(LOGS_URL).done((resp) => {
        const rawGamesArr = resp;
        const analyzedGames = {};
        rawGamesArr.forEach(game => analyzedGames[game.id] = GameAnalysis.analyzeGame(game));
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

    handlePlayerNamesChange = (event) => {
      this.setState({playerNames: event.target.value});
    }

    render() {
      const { loading, games, playerNames, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.state;

      let content = null;

      const showGameExplorer = !_.isEmpty(games);
      const showLeaderboard = !_.isEmpty(playerNames) && !_.isEmpty(games);
      const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
      if (loading) {
        content = 'Loading...';
      } else if (!showGameExplorer && !showLeaderboard) {
        content = 'Nothing to display :(';
      } else {
        content = [
          showLeaderboard ? <window.App.Leaderboard key="leaderboard" highlightPlayers={playerNames} games={games} /> : null,
          showGameExplorer ? <window.App.GameExplorer key="gameExplorer" games={games} /> : null,
        ];
      }

      return (
        <div className="rootContainer">
          <div className="rootContainer-content">
            <div className="rootContainer-globalFilters">
              Player names filter (player1,player2,etc): <input onChange={this.handlePlayerNamesChange} type="text" />
            </div>
            {content}
          </div>
          <div className="rootContainer-lastUpdatedStats">
            {showLastUpdatedStats ? <window.App.LastUpdatedStats key="lastUpdatedStats" lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
          </div>
        </div>
      );
    }
  }

  return RootContainer;
}());
