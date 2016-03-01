import 'webrtc-adapter/out/adapter.js';
import EventEmitter from 'events';

var configuration = {
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"},
    {urls: "turn:numb.viagenie.ca", credential: "w0kkaw0kka", username: "paul.sachs%40influitive.com"}
  ]
};
export default class FirePeer extends EventEmitter {
  constructor(firebaseRef, userId, isMuted, isVideoMuted){

    super();    
    this.firebaseRef = firebaseRef;
    this.userRef = firebaseRef.child(userId);
    this.userId = userId;
    this.eventHandlers = {};
    this.options = { audio: true, video: true };
    this.connections = {};
    // Stores mediastreams with the key being the id of the target peer
    this.mediaStreams = {};
    this.isMutedRef = this.userRef.child("isMuted");
    this.isVideoMutedRef = this.userRef.child("isVideoMuted");
    this.offersRef = this.userRef.child("offers");
    this.answersRef = this.userRef.child("answers");
    this.userRef.onDisconnect().remove();
    this.isMuted = isMuted;
    this.isVideoMuted = isVideoMuted;
    
    this.isMutedRef.set(this.isMuted);
    this.isVideoMutedRef.set(this.isVideoMuted);
    
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
    
    this.firebaseRef.on("child_removed", (snapshot) => {
      const peerId = snapshot.key();
      if (this.userId == peerId) {
        this.handleDisconnect();
      }
    });
    
    this.isMutedRef.on("value", this.handleIsMuted);
    
    this.isVideoMutedRef.on("value", this.handleIsVideoMuted);
  }


  connect = (peerId) => {
    if (this.connections[peerId] && this.connections[peerId].signalingState != 'closed') {
      console.log('Could send offer, already have connection');
      return;
    }
    const connection = new RTCPeerConnection(configuration);
    this.connections[peerId] = connection;
    this.onaddstream = this.handleAddStream;
    
    
    // place an offer on the room.
    const media = this.getPeerMedia();
    return media.then((mediaStream)=> {
      connection.addStream(mediaStream);
      this.emit('stream_added', { stream: mediaStream, isSelf: true});
      this.mediaStreams[peerId] = mediaStream;
      return connection.createOffer();
    }).then((desc)=> {
      return connection.setLocalDescription(desc);
    }).then(() => {
      const desc = connection.localDescription;
      this.firebaseRef.child(peerId).child("offers").child(this.userId)
        .set(JSON.stringify(desc.sdp));
      this.emit('sent_offer', peerId, desc);
    }).catch(this.handleError);

  };
  
  disconnectFrom = (peerId) => {
    if(this.connections[peerId]) {
      this.connections[peerId].close();
    }
  };
  
  mute = (mute) => {
    this.isMutedRef.set(mute);
  };
  
  muteVideo = (mute) => {
    this.isVideoMutedRef.set(mute);
  };
  
  disconnect = () => {
    this.userRef.remove();
  };
  
  // Private:
  
  handleDisconnect = () => {
    for (let key of Object.keys(this.connections)) {
      this.connections[key].close();
    }
  }
  
  
  getPeerMedia = () => {
    const media = navigator.mediaDevices.getUserMedia(
      { audio: !this.isMuted, video: !this.isVideoMuted}
    );
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
      this.emit('stream_added', { stream: mediaStream, isSelf: true});
      this.mediaStreams[peerId] = mediaStream;
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

  

  handleError = (error) => {
    console.error("FirePeer: ");
    console.error(error);
  };
  
  handleIsMuted = (snapshot) => {
    this.isMuted = snapshot.val();
    for (const peerId of Object.keys(this.mediaStreams)) {
      const stream = this.mediaStreams[peerId];
      const audioTracks = stream.getAudioTracks();
      for (const audioTrack of audioTracks) {
        audioTrack.enabled = !this.isMuted;
      }
    }
    this.emit("muted", this.isMuted);
  };
  
  handleIsVideoMuted = (snapshot) => {
    this.isVideoMuted = snapshot.val();
    for (const peerId of Object.keys(this.mediaStreams)) {
      const stream = this.mediaStreams[peerId];
      const videoTracks = stream.getVideoTracks();
      for (const videoTrack of videoTracks) {
        videoTrack.enabled = !this.isVideoMuted;
      }
    }
    this.emit("video_muted",  this.isVideoMuted);
  };
  
  logInfo = () => {
    for (const peerId of Object.keys(this.mediaStreams)) {
      const stream = this.mediaStreams[peerId];
      console.log(peerId);
      console.log("----");
      console.log("stream:");
      console.log(stream);
      console.log("audioTracks:");
      console.log(stream.getAudioTracks());
      console.log("videoTracks:");
      console.log(stream.getVideoTracks());
      console.log("----");
    }
  }

}
