//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router';

import WebRTC from 'common/WebRTC';
import RoomSession from 'components/RoomSession';
import Rebase from 're-base';

const base = Rebase.createClass('https://lillywood.firebaseio.com/building1');

const userID = 'user1';

export class App extends React.Component {
  state = {
    rooms: {},
    currentRoomName: null
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    base.bindToState('rooms', {
      context: this,
      state: 'rooms',
      asArray: false
    });
  }

  componentWillMount() {
    WebRTC.on('readyStateChange', (state, error, room) => {
      if (state===2) {
        // Connected!
        base.post(`rooms/${room}/participants/${userID}`, {data: true});
        base.post(`users/${userID}/rooms/${room}`, {data: true});
        if (this.state.currentRoomName != null){
          base.post(`rooms/${this.state.currentRoomName}/participants/${userID}`, {data: false});
          base.post(`users/${userID}/rooms/${this.state.currentRoomName}`, {data: false});
        }

        this.setState({currentRoomName: room});
      }
    });
  }

	render() {
    const {localStream} = this.state;
		return (
      <div>
        <div>
        Simple React + Babel + Hot reload + Webpack + React Router
        </div>
        <input type='text' ref='roomName'/>
        <button onClick={this.handleButton}>Join Room</button>
        { this.props.children }
      </div>
		);
	}

  handleButton = () => {
    const { router } = this.context;
    const roomName = this.refs.roomName.value;

    router.push(`/room/${roomName}`);
  };
}

const RoomSessionRoute = ({params, ...otherProps}) => (
  <RoomSession
    roomName={params.roomName}
    {...otherProps} />
);

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="/room/:roomName" component={RoomSessionRoute}/>
    </Route>
  </Router>
), document.querySelector("#myApp"));
