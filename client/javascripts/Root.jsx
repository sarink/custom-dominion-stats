window.App.Root = (function() {
  const { React, $, _ } = window;
  const { PropTypes, Component } = React;


  class Root extends Component {
    componentWillMount() {
      this.setState({
        playerNames: ['sarink','nisse038','cherrypeel'],
        filteredGames: this.props.allGames,
      });
    }

    // TODO ok, obviously this is terrible
    componentDidMount() {
      this.handlePlayerNamesChange({target: {value: this.state.playerNames.join(',')}});
    }

    handlePlayerNamesChange = (event) => {
      const playerNames = event.target.value.split(',');
      const filteredGames = this.props.allGames.filter(game => {
        return _.difference(game.playerList, playerNames).length === 0 && game.playerList.length === playerNames.length;
      });
      this.setState({playerNames, filteredGames});
    }

    render() {
      const { allGames, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.props;
      const { playerNames, filteredGames } = this.state;

      let content = null;

      const showGameExplorer = !_.isEmpty(filteredGames);
      const showLeaderboard = !_.isEmpty(filteredGames);
      const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
      if (!showGameExplorer && !showLeaderboard) {
        content = 'Nothing to display :(';
      } else {
        content = [
          showLeaderboard ? <window.App.Leaderboard key="leaderboard" highlightPlayers={playerNames.join(',')} games={filteredGames} /> : null,
          showGameExplorer ? <window.App.GameExplorer key="gameExplorer" games={filteredGames} /> : null,
        ];
      }

      return (
        <div className="root">
          <div className="root-content">
            <div className="root-globalFilters">
              Player names (AND, ex: player1,player2,etc): <input onChange={this.handlePlayerNamesChange} type="text" value={this.state.playerNames} />
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
