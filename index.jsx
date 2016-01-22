//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router'
import PeerVideo from 'components/PeerVideo';
import Peer from 'common/peer';
import _ from 'lodash'

import Rebase from 're-base';
const base = Rebase.createClass('https://lillywood.firebaseio.com/rebase-chat');

const roomID = 'room1';

export class App extends React.Component {
  state = {
    peersInRoom: [],
    localStream: null,
    localPeer: null
  };

  componentWillMount() {
    /*
     * Here we call 'bindToState', which will update
     * our local 'peersInRoom' state whenever our 'peers/#roomid'
     * Firebase endpoint changes.
     */
    base.syncState(`peers/${roomID}`, {
      context: this,
      state: 'peersInRoom',
      asArray: true,
      then: this.createPeer
    });

    window.navigator.getUserMedia({audio: true, video: true}, (stream) => {
      // Set your video displays
      this.setState({
        localStream: stream
      });
    }, () => { console.log('error')});
  }

	render() {
    const {localStream} = this.state;
		return (
      <div>
        <div>Simple React + Babel + Hot reload + Webpack + React Router {this.state.peersInRoom.length}</div>
        {this._getPeerVideos()}
        <div id="video-container">
          <video src={URL.createObjectURL(localStream)} muted="true" autoPlay></video>
        </div>
      </div>
		);
	}

  createPeer = () => {
    const localPeer = new Peer();
    localPeer.on('open', this._handleOpen);
    localPeer.on('error', this._handleError);
    this.setState({localPeer: localPeer});
  };

  _handleError = (error) => {
    console.log("ernkjsndfjkorr");
    console.log(error);
  };

  _handleOpen = (id) => {
    this.setState({
      peersInRoom: this.state.peersInRoom.concat(id)
    })
  };

  _getPeerVideos = () => {
    const {localStream, localPeer} = this.state;
    if(!localPeer)
      return null;

    return this.state.peersInRoom.filter((peerID) => {
      return peerID!=localPeer.id;
    }).map((peerID, index) => {
      return <PeerVideo key={index} localStream={localStream} localPeer={localPeer} targetPeerID={peerID} onClose={this._handlePeerClose}/>
    });
  };

  _handlePeerClose = (id) => {
    const { localPeer, peersInRoom} = this.state;
    localPeer.disconnect();
    console.log("Unmounting: "+localPeer.id);
    // For now, just remove it from firebase.
    let index = peersInRoom.indexOf(localPeer.id);
    this.setState({
      peersInRoom: peersInRoom.splice(index, 1)
    });
  };
}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
    </Route>
  </Router>
), document.querySelector("#myApp"));
