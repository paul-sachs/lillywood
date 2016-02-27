import 'webrtc-adapter/out/adapter.js';
import EventEmitter from 'events';

var configuration = {
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"}
  ]
};
export default class FirePeer extends EventEmitter {
  constructor(firebaseRef, userId, isMuted, isVideoAvailable){

    super();    
    this.firebaseRef = firebaseRef;
    this.userRef = firebaseRef.child(userId);
    this.userId = userId;
    this.eventHandlers = {};
    this.options = { audio: true, video: true };
    this.connections = {};
    this.presenceRef = this.userRef.child("presence");
    this.offersRef = this.userRef.child("offers");
    this.answersRef = this.userRef.child("answers");
    this.userRef.onDisconnect().remove();
    this.isMuted = isMuted;
    this.isVideoAvailable = isVideoAvailable;
    this.presenceRef.set(true);
    this.offersRef.on("child_added", (snapshot) => {
      const data = snapshot.val();
      const incomingPeerId = snapshot.key();
      this.acceptOffer(incomingPeerId, data).then(()=>{
        // Delete the offer once accepted.
        this.offersRef.child(incomingPeerId).set(null);
      });
    });

    this.answersRef.on("child_added", (snapshot) => {
      const data = snapshot.val();
      const incomingPeerId = snapshot.key();
      this.handleAnswer(incomingPeerId, data).then(()=>{
        // Delete the offer once accepted.
        this.answersRef.child(incomingPeerId).set(null);
      });
    });
    
  }


  connect = (peerId) => {
    if (this.connections[peerId] && this.connections[peerId].signalingState != 'closed') {
      console.log('Could send offer, already have connection');
      return;
    }
    const connection = new RTCPeerConnection(configuration);
    const options = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };
    this.connections[peerId] = connection;
    this.onaddstream = this.handleAddStream;
    // place an offer on the room.
    const media = this.getPeerMedia();
    return media.then((mediaStream)=> {
      connection.addStream(mediaStream);
      this.emit('stream_added', { stream: mediaStream, isSelf: true});
      return connection.createOffer(options);
    }).then((desc)=> {
      return connection.setLocalDescription(desc);
    }).then(() => {
      const desc = connection.localDescription;
      this.firebaseRef.child(peerId).child("offers").child(this.userId)
        .set(JSON.stringify(desc.sdp));
      this.emit('sent_offer', peerId, desc);
    }).catch(this.handleError);

  };
  
  getPeerMedia = () => {
    const media = navigator.mediaDevices.getUserMedia({ audio: !this.isMuted, video: this.isVideoAvailable});
    return media;
      
  };
  
  handleAddStream = (event) => {
    this.emit('stream_added', { stream: event.stream, isSelf: false});
  };

  acceptOffer = (peerId, offer) => {
    if (this.connections[peerId] && this.connections[peerId].signalingState != 'closed') {
      console.log('Could not accept offer, already have connection');
      return;
    }
    const connection = new RTCPeerConnection(configuration);

    this.connections[peerId] = connection;
    // place an offer on the room.
    const media = this.getPeerMedia();
    const remote_descr = new RTCSessionDescription();
    remote_descr.type = "offer";
    remote_descr.sdp  = JSON.parse(offer);
    return media.then((mediaStream)=> {
      connection.addStream(mediaStream);
      return connection.setRemoteDescription(remote_descr);
    }).then(()=> {
      return connection.createAnswer();
    }).then((answer) => {
      return connection.setLocalDescription(answer);
    }).then(()=> {
      const answer = connection.localDescription;
      this.firebaseRef.child(peerId).child("answers").child(this.userId)
        .set(JSON.stringify(answer.sdp));
      this.emit('accepted_offer', peerId, answer);
    }).catch(this.handleError);
  };

  handleAnswer = (peerId, answer) => {
    const remote_descr = new RTCSessionDescription();
    remote_descr.type = "answer";
    remote_descr.sdp  = JSON.parse(answer);
    return this.connections[peerId].setRemoteDescription(remote_descr).then(() => {
      this.emit('handled_answer', peerId, answer);
    }).catch(this.handleError);
  };

  disconnect = (peerId) => {
    if(peerId && this.connections[peerId]) {
      this.connections[peerId].close();
    }
    else {
      for(let connection of this.connections) {
        connection.close();
      }
    }
  };

  handleError = (error) => {
    console.error("FirePeer: ");
    console.error(error);
  };

}
