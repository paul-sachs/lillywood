//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React, { PropTypes } from 'react';
import { render } from 'react-dom';


export default class PeerVideo extends React.Component {
  state = {
    streamSrc: null
  };

  static props = {
    localPeer:    PropTypes.object.isRequired,
    localStream:  PropTypes.object.isRequired,
    targetPeerID: PropTypes.string.isRequired,
    onClose:      PropTypes.func,
  };


  static defaultProps = {
    onClose: () => {}
  };

  componentWillMount() {
    const { localPeer, targetPeerID, localStream } = this.props;

    localPeer.on('call', this._handleCall);
    const call = localPeer.call(targetPeerID, localStream);

  }

  _handleCall = (mediaConnection) => {
    const {targetPeerID, localStream} = this.props;
    const eventTargetID = mediaConnection.peer;

    // Not intended for this component.
    if (targetPeerID != eventTargetID)
      return;

    mediaConnection.on('stream', this._handleStream);
    mediaConnection.on('close', this._hadnleClose);
    mediaConnection.on('error', this._handleClose);
    mediaConnection.answer(localStream);
  };

  _handleStream = (stream) => {
    this.setState({
      streamSrc: URL.createObjectURL(stream)
    });
  };

  _handleClose = (error) => {
    console.log("Closseresdsd");
    this.props.onClose(this.props.targetPeerID, error);
  };


  render() {
    return (
      <div className="video-container">
        <video src={this.state.streamSrc} muted="true" autoPlay></video>
      </div>
    );
  }
}
