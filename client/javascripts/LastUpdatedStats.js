window.App.LastUpdatedStats = (function() {
  const { React } = window;
  const { Component, PropTypes } = React;

  class LastUpdatedStats extends Component {
    render() {
      const { lastGitPull, lastDbUpdate } = this.props;
      const style = { float: 'right' };
      const lastGitPullDate = new Date(lastGitPull);
      const lastDbUpdateDate = new Date(lastDbUpdate);
      return (
        <div style={style}>
          <div>Last git pull: {lastGitPullDate.toString()}</div>
          <div>Last db update: {lastDbUpdateDate.toString()}</div>
        </div>
      );
    }
  }
  LastUpdatedStats.propTypes = {
    lastGitPull: PropTypes.string,
    lastDbUpdate: PropTypes.string,
  };

  return LastUpdatedStats;
}());
