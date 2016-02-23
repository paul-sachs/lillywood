import FirePeer from './firepeer.js';

export default class FireRoom {

  constructor(firebaseRef, userId){
    this.rooms = firebaseRef.child('room');
    this.userId = userId;
    this.currentRoomRef = null;
    this.myPeer = null
  }

  connect = (roomId) => {
    this.currentRoomRef = this.rooms.child(roomId);

    this.myPeer = new FirePeer(roomRef, this.userId);

    this.setup();
  };

  disconnect = () => {
    if( this.currentRoomRef == null)
      throw new Error("Cannot disconnect when no room is connected.");
    this.currentRoomRef.off();
    this.currentRoomRef = null;
  };

  setup = () => {
    this.currentRoomRef.on("child_added", function(snapshot) {
      var data = snapshot.val();
      if (snapshot.key()!=this.userid && data.presence) {
        this.myPeer.connect(snapshot.key());
      }
    });

    this.currentRoomRef.on("child_changed", function(snapshot) {
      var data = snapshot.val();
      if (!data.presence) {
        this.myPeer.connect(snapshot.key());
      }
      else {
        this.myPeer.disconnect(snapshot.key());
      }
    });
  }


}
