import FirePeer from './firepeer';
import EventEmitter from 'events';

function shouldMakeOffer(peerId1, peerId2) {
  return (peerId1 < peerId2);
}

export default class FireRoom extends EventEmitter{

  constructor(firebaseRef, userId, isMuted, isVideoMuted){
    super();
    this.rooms = firebaseRef.child('room');
    this.userId = userId;
    this.currentRoomRef = null;
    this.myPeer = null;
    this.isMuted = isMuted;
    this.isVideoMuted = isVideoMuted;
  }

  connect = (roomId) => {
    this.currentRoomRef = this.rooms.child(roomId);

    this.myPeer = new FirePeer(this.currentRoomRef, this.userId, this.isMuted, this.isVideoMuted);

    this.currentRoomRef.on("child_added", this.handlePeerAdded);

    this.currentRoomRef.on("child_removed", this.handlePeerRemoved);
    
    this.myPeer.on("handled_answer", this.handlePeerConnected);
    
    this.myPeer.on("accepted_offer", this.handlePeerConnected);
    
    this.pipeEvents("muted");
    
    this.pipeEvents("video_muted");
  };
  
  pipeEvents = (event) => {
    this.myPeer.on(event, (...args) => {
      this.emit(event, ...args);
    });
  };
  
  handlePeerAdded = (snapshot) => {
    
    const data = snapshot.val();
    const addedPeer = snapshot.key();
    if (addedPeer != this.userid && shouldMakeOffer(this.userId, addedPeer)) {
      this.myPeer.connect(addedPeer);
    }
  };
  
  handlePeerRemoved = (snapshot) => {
    const data = snapshot.val();
    const removedPeer = snapshot.key();
    if(removedPeer != this.userid){
      this.myPeer.disconnect(removedPeer);
      this.emit("peer_disconnected", removedPeer);
    }
  };

  
  handlePeerConnected = (peerId, answerOrOffer) => {
    this.emit("peer_connected", peerId);
  };

  disconnect = () => {
    if( this.currentRoomRef == null)
      throw new Error("Cannot disconnect when no room is connected.");
    this.myPeer.disconnect();
    this.currentRoomRef.off();
    this.currentRoomRef = null;
  };
  
  muteMyMicrophone = (mute) => {
    this.myPeer.mute(mute);
  };
  
  muteMyCamera = (mute) => {
    this.myPeer.muteVideo(mute);
  }
  
  logPeerInfo = () => {
    this.myPeer.logInfo();
  }
}
