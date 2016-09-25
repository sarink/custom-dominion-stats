import React, { PropTypes, Component } from 'react';
import $ from 'jquery';
import _ from 'lodash';

import Leaderboard from 'javascripts/Leaderboard';
import GameExplorer from 'javascripts/GameExplorer';
import LastUpdatedStats from 'javascripts/LastUpdatedStats';

export default class Root extends Component {
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
    if (_.isEmpty(event.target.value)) {
      this.setState({playerNames: '', filteredGames: this.props.allGames});
    } else {
      const playerNames = event.target.value.split(',');
      const filteredGames = this.props.allGames.filter(game => {
        return _.difference(game.playerList, playerNames).length === 0 && game.playerList.length === playerNames.length;
      });
      this.setState({playerNames, filteredGames});
    }
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
        showLeaderboard ? <Leaderboard key="leaderboard" highlightPlayers={playerNames ? playerNames.join(',') : ''} games={filteredGames} /> : null,
        showGameExplorer ? <GameExplorer key="gameExplorer" games={filteredGames} /> : null,
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
          {showLastUpdatedStats ? <LastUpdatedStats key="lastUpdatedStats" lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
        </div>
      </div>
    );
  }
}
