import React, { PropTypes, Component } from 'react';
import $ from 'jquery';
import _ from 'lodash';

import Leaderboard from 'javascripts/Leaderboard';
import GameExplorer from 'javascripts/GameExplorer';
import LastUpdatedStats from 'javascripts/LastUpdatedStats';

export default class Root extends Component {
  render() {
    const { allGames, lastGitPull, lastDbUpdate, lastDbLogUrl } = this.props;

    let content = null;

    const showGameExplorer = !_.isEmpty(allGames);
    const showLeaderboard = !_.isEmpty(allGames);
    const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
    if (!showGameExplorer && !showLeaderboard) {
      content = 'Nothing to display :(';
    } else {
      content = [
        showLeaderboard ? <Leaderboard key="leaderboard" games={allGames} /> : null,
        showGameExplorer ? <GameExplorer key="gameExplorer" games={allGames} /> : null,
      ];
    }

    return (
      <div className="root">
        <div className="root-content">
          {content}
        </div>
        <div className="root-lastUpdatedStats">
          {showLastUpdatedStats ? <LastUpdatedStats key="lastUpdatedStats" lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
        </div>
      </div>
    );
  }
}
