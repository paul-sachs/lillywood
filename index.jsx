//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from 'react-router'
import PeerVideo from 'components/PeerVideo';
import _ from 'lodash'

import WebRTC from 'common/WebRTC';
import Rebase from 're-base';
import Config from 'config';

const base = Rebase.createClass('https://lillywood.firebaseio.com/rebase-chat');

const roomID = 'room1';

const Constants = {
  RoomState: {
    IDLE: 'IDLE',
    LOCKED: 'LOCKED',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING'
  },
  AppState: {
    FOYER: 0
  }
}

export class App extends React.Component {
  state = {
    users: [
      {
        id: 0,
        name: '',
        stream: null,
        audioMute: false,
        videoMute: false,
        screensharing: false,
        updatedStreamRender: 0
      }
    ],
    state: Constants.AppState.FOYER,
    controls: true,
    chat: true,
    room: {
      id: '',
      messages: [],
      isLocked: false,
      status: Constants.RoomState.IDLE,
      useMCU: false
    }
  };

  componentWillMount() {
    WebRTC.setLogLevel(WebRTC.LOG_LEVEL.DEBUG);

    WebRTC.on('readyStateChange', (state) => {
      if(state === 0) {
        console.log("IDLE!!");
        this.setState({
          room: _.extend(this.state.room, {
            status: Constants.RoomState.IDLE
          })
        });
      }
      else if(state === 1) {
        console.log("CONNECTING!!");
        this.setState({
          room: _.extend(this.state.room, {
            status: Constants.RoomState.CONNECTING
          })
        });
      }
      else if(state === 2) {
         console.log("CONNECTED!!");
        this.setState({
          room: _.extend(this.state.room, {
            status: Constants.RoomState.CONNECTED
          })
        });
      }
      else if(state === -1) {
        this.setState({
          room: _.extend(this.state.room, {
            status: Constants.RoomState.LOCKED
          })
        });
      }
    });

    WebRTC.on("channelError", (error) => {
      this.setState({
        room: _.extend(this.state.room, {
          status: Constants.RoomState.IDLE,
          screensharing: false
        }),
        state: Constants.AppState.FOYER,
        controls: true
      });

      alert("ERROR: " + error.toString());
    });

    WebRTC.on('peerJoined', (peerId, peerInfo, isSelf) => {
      if(this.state.users.length === ConfigmaxUsers || isSelf) {
        return;
      }

      var state = {
        users: this.state.users.concat({
          id: peerId,
          name: 'Guest ' + peerId,
          stream: null,
          error: null,
          screensharing: peerInfo.userData.screensharing,
          videoMute: peerInfo.mediaStatus.videoMuted,
          audioMute: peerInfo.mediaStatus.audioMuted,
          updatedStreamRender: 0
        })
      };

      if(peerInfo.userData.screensharing) {
        state.room = _.extend(this.state.room, {
          screensharing: peerInfo.userData.screensharing
        });
      }

      this.setState(state);
    });

    WebRTC.on('incomingStream', (peerId, stream, isSelf) => {
      var state = {
        users: this.state.users.map( (user) => {
          if((isSelf && user.id === 0) || user.id === peerId) {
            user.stream = stream;
            user.updatedStreamRender += 1;
          }
          return user;
        })
      };

      if(this.state.users.length === Config.maxUsers) {
        WebRTC.lockRoom();
      }
      else if(this.state.users.length >= 2) {
        state.controls = false;
      }

      this.setState(state);
    });

    WebRTC.on('peerUpdated', (peerId, peerInfo, isSelf) => {
      var state = {
        users: this.state.users.map( (user) => {
          if((isSelf && user.id === 0) || user.id === peerId) {
            user.audioMute = peerInfo.mediaStatus.audioMuted;
            user.videoMute = peerInfo.mediaStatus.videoMuted;
            user.screensharing = peerInfo.userData.screensharing;
            user.name = peerInfo.userData.name;
          }
          return user;
        })
      };

      if(this.state.users[0].screensharing === false) {
        state.room = _.extend(this.state.room, {
          screensharing: peerInfo.userData.screensharing
        });
      }

      this.setState(state);
    });

    WebRTC.on('peerLeft', (peerId, peerInfo, isSelf) => {
      var state = {
        users: this.state.users.filter((user) => {
            return user.id !== peerId;
          })
      };

      if(state.users.length === Config.maxUsers - 1) {
        WebRTC.unlockRoom();
      }
      else if(state.users.length === 1) {
        state.controls = true;

        if(!this.state.users[0].screensharing) {
          state.room = _.extend(this.state.room, {
            screensharing: false
          });
        }
      }

      this.setState(state);
    });

    WebRTC.on("roomLock", (isLocked) => {
      this.setState({
        room: _.extend(this.state.room, {
          isLocked: isLocked
        })
      });
    });

    WebRTC.on("systemAction", (action, message, reason) => {
      if(reason === WebRTC.SYSTEM_ACTION_REASON.ROOM_LOCKED) {
        this.setState({
          room: _.extend(this.state.room, {
            status: Constants.RoomState.LOCKED,
            isLocked: true
          }),
          controls: true
        });
      }
    });
  }

  Dispatcher = {
    sharescreen: (enable) => {
      this.setState({
        users: this.state.users.map( (user) => {
          if(user.id === 0) {
            user.screensharing = enable;
          }
          return user;
        }),
        room: _.extend(this.state.room, {
          screensharing: enable
        })
      });
      WebRTC.setUserData({
        name: this.state.users[0].name,
        screensharing: enable
      });
    },
    setMCU: (state) => {
      this.setState({
        room: _.extend(this.state.room, {
          useMCU: !!state
        })
      });
    },
    setName: (name) => {
      this.setState({
        users: this.state.users.map( (user) => {
          if(user.id === 0) {
            user.name = name;
          }
          return user;
        })
      });
      WebRTC.setUserData({
        name: name,
        screensharing: this.state.users[0].screensharing
      });
    },
    toggleControls: (state) => {
      if(this.state.room.status === Constants.RoomState.CONNECTED) {
        this.setState({
          controls: state !== undefined ? state : !this.state.controls
        });
      }
    }
  };

  joinRoom = (room) => {
    if(room === undefined) {
      return;
    }
    room = room.toString();
    this.setState({
      state: Constants.AppState.IN_ROOM,
      room: _.extend(this.state.room, {
        id: room,
        status: Constants.RoomState.IDLE,
        screensharing: false
      }),
      controls: true
    });

    WebRTC.init({
      apiKey: Config.apiMCUKey,
      defaultRoom: room
    }, () => {
      WebRTC.joinRoom({
        audio: true,
        video: true
      });
    });
  };

	render() {
    const {localStream} = this.state;
		return (
      <div>
        <div>
        Simple React + Babel + Hot reload + Webpack + React Router {this.state.room.id}
        </div>
        <input type='text' ref='roomName'/>
        <button onClick={this.handleButton}>Join Room</button>
      </div>
		);
	}

  handleButton = () => {
    const roomName = this.refs.roomName.value;
    this.joinRoom(roomName);
  };
}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
    </Route>
  </Router>
), document.querySelector("#myApp"));
