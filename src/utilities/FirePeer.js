import peer from 'peerjs';


var configuration = {
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"}
  ]
};
export default class FirePeer {

  events = {
    incomingStream: 'incomingStream'
  };

  constructor(firebaseRef, userId){
    this.userRef = firebaseRef.child(userId);
    this.userId = userId;
    this.eventHandlers = {};
    this.options = { audio: true, video: true };
    this.connections = {};
    this.presenceRef = this.userRef.child("presence");
    this.offersRef = this.userRef.child("offers");
    this.answersRef = this.userRef.child("answers");
    this.offersRef.setOnDisconnect(null);
    this.answersRef.setOnDisconnect(null);
    this.presenceRef.setOnDisconnect(false);

    this.presenceRef.set(true);

    this.offersRef.on("child_added", function(snapshot) {
      const data = snapshot.val();
      const incomingPeerId = snapshot.key();
      this.acceptOffer(incomingPeerId, data).then(()=>{
        // Delete the offer once accepted.
        this.offersRef.child(incomingPeerId).set(null);
      });
    });

    this.offersRef.on("child_added", function(snapshot) {
      const data = snapshot.val();
      const incomingPeerId = snapshot.key();
      this.acceptOffer(incomingPeerId, data).then(()=>{
        // Delete the offer once accepted.
        this.offersRef.child(incomingPeerId).set(null);
      });
    });
  }


  connect = (peerId) => {
    const connection = new RTCPeerConnection(configuration);
    this.connections[peerId] = connection;
    this.onaddstream = this.handleAddStream;
    // place an offer on the room.
    var p = navigator.mediaDevices.getUserMedia();

    return p.then((mediaStream)=> {
      connection.addStream(mediaStream);
      return connection.createOffer();
    }).then((desc)=> {
      return connection.setLocalDescription(desc);
    }).then((desc) => {
      firebaseRef.child(peerId).child("offers").child(this.userId)
        .set(JSON.stringify(desc));
    }).catch(handleError);

  };

  acceptOffer = (peerId, offer) => {
    const connection = new RTCPeerConnection(configuration);
    this.connections[peerId] = connection;
    // place an offer on the room.
    var p = navigator.mediaDevices.getUserMedia();

    return p.then((mediaStream)=> {
      connection.addStream(mediaStream);
      return connection.setRemoteDescription(JSON.parse(offer));
    }).then(()=> {
      return connection.createAnswer();
    }).then((answer) => {
      return connection.setLocalDescription(answer);
    }).then((answer)=> {
      firebaseRef.child(peerId).child("answers").child(this.userId)
        .set(JSON.stringify(answer));
    }).catch(handleError);
  };

  disconnect = (peerId) => {
    if(peerId) {
      this.connections[peerId].close();
    }
    else {
      for(let connection of this.connections) {
        connection.close();
      }
    }
  };

  handleError = (error) => {
    Promise.reject(error);
  };

}
