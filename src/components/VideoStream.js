//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';

export class VideoStream extends React.Component {
  state = {

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

  shouldComponentUpdate() {
    return false;
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
