//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router';

import WebRTC from 'common/WebRTC';
import RoomSession from 'components/RoomSession';
import RoomLayout from 'components/RoomLayout';
import Rebase from 're-base';

const base = Rebase.createClass('https://lillywood.firebaseio.com/building1');

const userID = 'user1';

export class App extends React.Component {
  state = {
    users: {},
    currentRoomName: null,
    currentUserID: null
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    base.bindToState('user', {
      context: this,
      state: 'users',
      asArray: false
    });
  }

  componentWillMount() {
    WebRTC.on('readyStateChange', (state, error, room) => {
      if (state===2) {
        console.log("Outer readyStateChange ...");
        base.post(`user/${this.state.currentUserID}/room`, {data: room});

        this.setState({currentRoomName: room});
      }
    });

    window.addEventListener('beforeunload', this.removeCurrentRoom);
  }

  componentWillUnmount() {
    removeCurrentRoom();
  }

	render() {
    const {localStream} = this.state;
		return (
      <div>
        <label>Room:</label><input type='text' ref='roomName'/>
        <label>User:</label><input type='text' ref='userID'/>
        <button onClick={this.handleButton}>Join Room</button>
        <button onClick={this.leaveRoom}>Leave Room</button>
        { this.props.children }
        <RoomLayout
          roomName={this.state.currentRoomName} users={this.state.users}/>
      </div>
		);
	}

  removeCurrentRoom = () => {
    base.post(`user/${this.state.currentUserID}/room`, {data: null});
  };

  handleButton = () => {
    const { router } = this.context;
    const roomName = this.refs.roomName.value;

    this.setState({currentUserID: this.refs.userID.value}, () => {
      router.push(`/room/${roomName}`);
    });
  };

  leaveRoom = () => {
    const { router } = this.context;
    this.removeCurrentRoom();
    router.push(`/`);
  };
}

const RoomSessionRoute = ({params, ...otherProps}) => (
  <div>
    <RoomSession
      roomName={params.roomName}
      {...otherProps} />
  </div>
);

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="/room/:roomName" component={RoomSessionRoute}/>
    </Route>
  </Router>
), document.querySelector("#app"));
