/* @flow */ 

import React, { Component, PropTypes } from 'react';

import styles from './LastUpdatedStats.scss';

type LastUpdatedStatsProps = {
  lastGitPull: ?string,
  lastDbUpdate: ?string,
  lastDbLogUrl: ?string,
};

const LastUpdatedStats = (props: LastUpdatedStatsProps) => {
  const { lastGitPull, lastDbUpdate, lastDbLogUrl } = props;
  const lastGitPullDate = new Date(lastGitPull || 0);
  const lastDbUpdateDate = new Date(lastDbUpdate || 0);
  return (
    <div className={styles.lastUpdatedStats}>
      <div>Last git pull: {lastGitPullDate.toString()}</div>
      <div>Last db update: {lastDbUpdateDate.toString()}</div>
      <div>Last db log url: <a target="_blank" href={lastDbLogUrl}>{lastDbLogUrl}</a></div>
    </div>
  );
};

LastUpdatedStats.propTypes = {
  lastGitPull: PropTypes.string,
  lastDbUpdate: PropTypes.string,
  lastDbLogUrl: PropTypes.string,
};

export default LastUpdatedStats;
