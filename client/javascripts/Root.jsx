/* @flow */

import React, { PropTypes, Component } from 'react';
import $ from 'jquery';
import _ from 'lodash';

import Leaderboard from 'javascripts/Leaderboard';
import GameExplorer from 'javascripts/GameExplorer';
import LastUpdatedStats from 'javascripts/LastUpdatedStats';

import styles from './Root.scss';

import type { AnalyzedGame } from 'javascripts/GameAnalysis';
type RootPropTypes = {
  allGames: Array<AnalyzedGame>,
  lastGitPull: ?string,
  lastDbUpdate: ?string,
  lastDbLogUrl: ?string
};

const Root = (props: RootPropTypes) => {
  const { allGames, lastGitPull, lastDbUpdate, lastDbLogUrl } = props;

  const initialLeaderboardPlayers = ['sarink', 'cherrypeel', 'nisse038'];

  let content = null;

  const showGameExplorer = !_.isEmpty(allGames);
  const showLeaderboard = !_.isEmpty(allGames);
  const showLastUpdatedStats = !_.isEmpty(lastGitPull) || !_.isEmpty(lastDbUpdate) || !_.isEmpty(lastDbLogUrl);
  if (!showGameExplorer && !showLeaderboard) {
    content = 'Nothing to display :(';
  } else {
    content = [
      showLeaderboard ? <Leaderboard key="leaderboard" games={allGames} initialPlayerList={initialLeaderboardPlayers} /> : null,
      showGameExplorer ? <GameExplorer key="gameExplorer" games={allGames} /> : null,
    ];
  }

  return (
    <div className={styles.root}>
      {showLastUpdatedStats ? <LastUpdatedStats key="lastUpdatedStats" lastGitPull={lastGitPull} lastDbUpdate={lastDbUpdate} lastDbLogUrl={lastDbLogUrl}/> : null}
      {content}
    </div>
  );
};

Root.propTypes = {
  allGames: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Root;
