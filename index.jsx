//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link } from 'react-router';
import History from 'history';

import RoomSession from 'components/RoomSession';

import Rebase from 're-base';
import Config from 'config';

const base = Rebase.createClass('https://lillywood.firebaseio.com/building1');

export class App extends React.Component {
  state = {
    rooms: {}
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    base.syncState('rooms', {
      context: this,
      state: 'rooms',
      asArray: false
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

const RoomSessionRoute = ({params}) => (
  <RoomSession roomName={params.roomName} config={Config}/>
);

render((
  <Router history={History}>
    <Route path="/" component={App}>
      <Route path="/room/:roomName" component={RoomSessionRoute}/>
    </Route>
  </Router>
), document.querySelector("#myApp"));
