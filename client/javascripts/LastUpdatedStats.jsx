import React, { Component, PropTypes } from 'react';

export default class LastUpdatedStats extends Component {
  render() {
    const { lastGitPull, lastDbUpdate, lastDbLogUrl } = this.props;
    const lastGitPullDate = new Date(lastGitPull);
    const lastDbUpdateDate = new Date(lastDbUpdate);
    return (
      <div className="lastUpdatedStats">
        <div>Last git pull: {lastGitPullDate.toString()}</div>
        <div>Last db update: {lastDbUpdateDate.toString()}</div>
        <div className="lastUpdatedStats-lastDbLogUrl">Last db log url: <a target="_blank" href={lastDbLogUrl}>{lastDbLogUrl}</a></div>
      </div>
    );
  }
}
LastUpdatedStats.propTypes = {
  lastGitPull: PropTypes.string,
  lastDbUpdate: PropTypes.string,
  lastDbLogUrl: PropTypes.string,
};
