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
  };
  
  handlePeerAdded = (snapshot) => {
    
    const data = snapshot.val();
    const addedPeer = snapshot.key();
    if (addedPeer!=this.userid && data.presence && shouldMakeOffer(this.userId, addedPeer)) {
      this.myPeer.connect(addedPeer);
    }
  };
  
  handlePeerRemoved = (snapshot) => {
    const data = snapshot.val();
    const removedPeer = snapshot.key();
    
    if (changedPeer==this.userid){
      return;
    }
    if (!data.presence) {
      this.myPeer.disconnect(changedPeer);
    }
  };

  
  handlePeerConnected = (peerId, answerOrOffer) => {
    this.emit("peer_connected", peerId);
  };

  disconnect = () => {
    if( this.currentRoomRef == null)
      throw new Error("Cannot disconnect when no room is connected.");
    this.currentRoomRef.off();
    this.currentRoomRef = null;
  };
}
