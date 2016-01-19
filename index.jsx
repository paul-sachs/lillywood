//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router'

import Rebase from 're-base';
const base = Rebase.createClass('https://lillywood.firebaseio.com/rebase-chat');
import Conference from 'lib/conference';

export class App extends React.Component {
  state = {
    messages: []
  };

  componentWillMount() {
    /*
     * Here we call 'bindToState', which will update
     * our local 'messages' state whenever our 'chats'
     * Firebase endpoint changes.
     */
    base.bindToState('chats', {
      context: this,
      state: 'messages',
      asArray: true
    });
  }

	render() {
		return (
      <div>Simple React + Babel + Hot reload + Webpack + React Router {this.state.messages.length}</div>
		);
	}

}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
    </Route>
  </Router>
), document.querySelector("#myApp"));
