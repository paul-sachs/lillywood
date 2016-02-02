import React, { Component, PropTypes } from 'react';
import { Router, Route, Link, browserHistory } from 'react-router';
import Rebase from 're-base';

const base = Rebase.createClass('https://lillywood.firebaseio.com/building1');

export default class RoomLayout extends Component {
  static propTypes = {
    roomName: PropTypes.string,
    users:    PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        {this.getRooms()}
      </div>
    );
  }

  getRooms() {
    let map = {};
    Object.keys(this.props.users).map((username) => {
      const user = this.props.users[username];
      if ( !map[user.room] )
        map[user.room] = {};
      if ( !map[user.room].participants )
        map[user.room].participants = [];
      map[user.room].participants.push(username);
    });
    // Need to map on keys of map
    return Object.keys(map).map((key) => {
      return (
        <div key={key}>
          <div> {key} </div>
          { map[key].participants.map((participant) => {
            return <div key={participant}> {participant} </div>;
          })}
        </div>
      );
    });
  }


}
