//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router'
import PeerVideo from 'components/PeerVideo';
import Peer from 'common/peer';

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
    base.bindToState(`peers/${roomID}`, {
      context: this,
      state: 'peersInRoom',
      asArray: true
    });

    window.navigator.getUserMedia({audio: true, video: true}, (stream) => {
      // Set your video displays
      this.setState({
        localStream: stream
      });
    }, () => { console.log('error')});

    const localPeer = new Peer();
    localPeer.on('open', this._handleOpen);

    this.setState({localPeer: localPeer});
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

  _handleOpen = (id) => {
    console.log("Adding id "+id+" to list:");
    console.log(this.state.peersInRoom);
    // Push new ID to db
    base.post(`peers/${roomID}`, {
      data: this.state.peersInRoom.concat(id),
      context: this,
      /*
       * This 'then' method will run after the
       * post has finished.
       */
      then: () => {
        console.log('POSTED');
      }
    });
  };

  _getPeerVideos = () => {
    const {localStream, localPeer} = this.state;
    if(!localPeer)
      return null;

    return this.state.peersInRoom.filter((peerID) => {
      return peerID!=localPeer.id;
    }).map((peerID, index) => {
      return <PeerVideo key={index} localStream={localStream} localPeer={localPeer} targetPeerID={peerID}/>
    });
  };
}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
    </Route>
  </Router>
), document.querySelector("#myApp"));
