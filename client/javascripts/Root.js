window.App.Root = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;


  class Root extends Component {
    constructor() {
      super();
      this.state = {
        playerNames: [],
      };
    }

    handlePlayerNamesChange = (event) => {
      const playerNames = event.target.value.split(',');
      this.setState({playerNames: event.target.value});
    }

    render() {
      const { games, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.props;
      const { playerNames } = this.state;

      let content = null;

      const showGameExplorer = !_.isEmpty(games);
      const showLeaderboard = !_.isEmpty(playerNames) && !_.isEmpty(games);
      const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
      if (!showGameExplorer && !showLeaderboard) {
        content = 'Nothing to display :(';
      } else {
        content = [
          showLeaderboard ? <window.App.Leaderboard key="leaderboard" highlightPlayers={playerNames} games={games} /> : null,
          showGameExplorer ? <window.App.GameExplorer key="gameExplorer" games={games} /> : null,
        ];
      }

      return (
        <div className="root">
          <div className="root-content">
            <div className="root-globalFilters">
              Player names filter (player1,player2,etc): <input onChange={this.handlePlayerNamesChange} type="text" />
            </div>
            {content}
          </div>
          <div className="root-lastUpdatedStats">
            {showLastUpdatedStats ? <window.App.LastUpdatedStats key="lastUpdatedStats" lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
          </div>
        </div>
      );
    }
  }

  return Root;
}());
