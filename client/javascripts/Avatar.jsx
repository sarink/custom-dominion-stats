import React, { PropTypes, Component } from 'react';
import _ from 'lodash';

export default class Avatar extends Component {
  static propTypes = {
    playerName: PropTypes.string.isRequired,
  }

  render() {
    const { playerName } = this.props;

    const weHaveAvatarsFor = ['sarink', 'nisse038', 'cherrypeel'];
    const avatarExists = _.includes(weHaveAvatarsFor, playerName);
    const avatar = (avatarExists)
      ? (
        <img className="avatar" src={`images/avatars/${playerName}.png`} />
      )
      : (
        <div className="avatar" style={{backgroundImage: 'url(images/avatars/default.jpg)'}}>
          <span>{playerName}</span>
        </div>
      );

    return avatar;
  }
}
