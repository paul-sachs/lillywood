//require("./node_modules/bootstrap/dist/css/bootstrap.min.css")
import React, {Component, PropTypes} from 'react';
import VideoStream from 'components/VideoStream';
import _ from 'lodash'

import WebRTC from 'common/WebRTC';
import Config from 'config';

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

export default class RoomSession extends Component {
  static props = {
    roomName: PropTypes.string.isRequired
  };

  state = {
    users: [],
    state: Constants.AppState.FOYER,
    controls: true,
    chat: true,
    room: {},
    myPeerInfo: {},
    myPeerId: null,
    myStream: null
  };

  componentWillReceiveProps(nextProps) {
    console.log("Components will receive");
    if(this.props.roomName != nextProps.roomName){
      console.log("====1");
      debugger;
      WebRTC.leaveRoom((error, success)=>{
        if (error){
          console.error("Failed to leave room: "+this.props.roomName);
        }
        else{
          console.log("Successfully left room: "+this.props.roomName);
          this.joinRoom(nextProps.roomName);
        }
      });
      console.log("====2");
    }
  }

  // componentWillUnmount() {
  //   console.log("Components will unmount");
  //   WebRTC.leaveRoom((error, success)=>{
  //     if (error){
  //       console.error("Failed to leave room: "+this.props.roomName);
  //     }
  //     else{
  //       console.log("Successfully left room: "+this.props.roomName);
  //     }
  //   });
  // }

  componentDidMount() {
    this.joinRoom(this.props.roomName);
  }

  componentWillMount() {
    WebRTC.setLogLevel(WebRTC.LOG_LEVEL.DEBUG);

    WebRTC.on('readyStateChange', (state, error, room) => {
      if(state === 0) {
        console.log("IDLE!!");
        this.setState({
          room: _.extend(this.state.room, {
            name: room,
            status: Constants.RoomState.IDLE
          })
        });
      }
      else if(state === 1) {
        console.log("CONNECTING!!");
        this.setState({
          room: _.extend(this.state.room, {
            name: room,
            status: Constants.RoomState.CONNECTING
          })
        });
      }
      else if(state === 2) {
         console.log("CONNECTED!!");
        this.setState({
          room: _.extend(this.state.room, {
            name: room,
            status: Constants.RoomState.CONNECTED
          })
        });
      }
      else if(state === -1) {
        this.setState({
          room: _.extend(this.state.room, {
            name: room,
            status: Constants.RoomState.LOCKED
          })
        });
      }
    });

    WebRTC.on("channelError", (error) => {
      console.log("channelError");
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
      console.log("peerJoined:"+peerId);
      console.log(peerInfo);
      if(isSelf) {
        this.setState({
          myPeerId: peerId,
          myPeerInfo: peerInfo
        });
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

      this.setState(state);
    });

    WebRTC.on('incomingStream', (peerId, stream, isSelf) => {
      console.log("incomingStream:"+peerId);
      console.log(stream);
      if(isSelf) {
        this.setState({
          myStream: stream
        });
        return;
      }

      this.setState({
        users: this.state.users.map( (user) => {
          if(user.id === peerId) {
            user.stream = stream;
            user.updatedStreamRender += 1;
          }
          return user;
        })
      });
    });

    WebRTC.on('peerUpdated', (peerId, peerInfo, isSelf) => {
      console.log("peerUpdated:"+peerId);
      console.log(peerInfo);
      if(isSelf) {
        this.setState({
          myPeerId: peerId,
          myPeerInfo: peerInfo
        });
        return;
      }

      this.setState({
        users: this.state.users.map( (user) => {
          if(user.id === peerId) {
            user.audioMute = peerInfo.mediaStatus.audioMuted;
            user.videoMute = peerInfo.mediaStatus.videoMuted;
            user.screensharing = peerInfo.userData.screensharing;
            user.name = peerInfo.userData.name;
          }
          return user;
        })
      });
    });

    WebRTC.on('peerLeft', (peerId, peerInfo, isSelf) => {
      console.log("peerLeft:"+peerId);
      console.log(peerInfo);
      this.setState({
        users: this.state.users.filter((user) => {
            return user.id !== peerId;
          })
      });
    });

    WebRTC.on("roomLock", (isLocked) => {
      console.log("peerLeft:"+peerId);
      console.log(peerInfo);
      this.setState({
        room: _.extend(this.state.room, {
          isLocked: isLocked
        })
      });
    });

    WebRTC.on("systemAction", (action, message, reason) => {
      console.log("systemAction:"+action);
      console.log(message);
      console.log(reason);
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
       // TODO: TRANSITION
      WebRTC.setUserData({
        name: this.state.users[0].name,
        screensharing: enable
      });
    },
    setName: (name) => {
       // TODO: TRANSITION
      WebRTC.setUserData({
        name: name,
        screensharing: this.state.users[0].screensharing
      });
    }
  };

  joinRoom = (room) => {
    if(room === undefined) {
      return;
    }
    room = room.toString();

    // TODO: TRANSITION

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
        <div className='peers'>
          { this._getPeerVideos() }
        </div>
        <div className='myStream'>
          <VideoStream stream={this.state.myStream}/>
        </div>
      </div>
    );
  }

  _getPeerVideos = () => {
    return this.state.users.map( (user) =>
      <VideoStream stream={user.stream}/>
    );
  };
}
