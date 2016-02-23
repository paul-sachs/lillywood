//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router';

//import WebRTC from 'common/WebRTC';
import FirePeer from 'utilities/FirePeer';
import RoomSession from 'components/RoomSession';
import RoomLayout from 'components/RoomLayout';
import Rebase from 're-base';
import Firebase from 'firebase';
import 'webrtc-adapter/out/adapter.js';

const appPath = 'https://lillywood.firebaseio.com';
const buildingPath = appPath+'/building1';
const base = Rebase.createClass(buildingPath);

const userID = 'user1';

export class App extends React.Component {
  state = {
    users: {},
    currentRoomName: null,
    currentUserID: null,
    currentAuth: null
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
    this.setState({
      currentAuth: base.getAuth()
    });

  }

  componentWillMount() {
    // WebRTC.on('readyStateChange', (state, error, room) => {
    //   if (state===2) {
    //     console.log("Outer readyStateChange ...");
    //     base.post(`user/${this.state.currentUserID}/room`, {data: room});

    //     this.setState({currentRoomName: room});
    //   }
    // });

    // window.addEventListener('beforeunload', this.removeCurrentRoom);
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

        {this.getLoginLogoutButton()}
      </div>
		);
	}

  getLoginLogoutButton = () => {
    if (this.isAuthed()){
      return (
        <button onClick={this.logout}>Logout</button>
      );
    }
    else{
      return (
        <button onClick={this.login}>Login</button>
      );
    }
  };

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

  login = () => {
    base.authWithOAuthPopup("google", (error, authData) => {
      if (error) {
        console.log("Login Failed!", error);
      } else {
        this.setState({currentAuth: authData});
        console.log("Authenticated successfully with payload:", authData);
      }
    });
  };

  logout = () => {
    base.unauth();
    this.setState({currentAuth: null});
  };

  isAuthed = () => {
    return this.state.currentAuth != null;
  };


}

const RoomSessionRoute = ({params, ...otherProps}) => (
  <div>

  </div>
);

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="/room/:roomName" component={RoomSessionRoute}/>
    </Route>
  </Router>
), document.querySelector("#app"));
