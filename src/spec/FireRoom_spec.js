var expect = require('expect');
import FireBase from 'firebase';

const appPath = 'https://lillywood.firebaseio.com';
const buildingPath = appPath+'/test';
const firebase = new Firebase(buildingPath);
import FireRoom from '../utilities/FireRoom'; 

xdescribe('When two peers join the same room', function () {
  const roomId = ('room' + Math.random()).replace(".","");
  const room = new FireRoom(firebase, 'user1', false, false);
  const room2 = new FireRoom(firebase, 'user2', false, false);
    
  it('each room gets a new peer connection', function ( done ) {
    
    let counter = 0;
    room.on("peer_connected", (peerId)=>{
      expect( peerId ).toBe('user2');
      counter ++;
    });
    
     room2.on("peer_connected", (peerId)=>{
      expect( peerId ).toBe('user1');
      counter ++;
    });
    
    room.connect(roomId);
    room2.connect(roomId);
    
    setTimeout(function() {
      expect(counter).toBe(2);
      done();
    }, 1500);
  });
  
  after('Disconnecting...',function(){
    room.disconnect();
    room2.disconnect();
  });
});



xdescribe('When three peers join the same room', function () {
  const roomId = ('room' + Math.random()).replace(".","");
  const room = new FireRoom(firebase, 'user1', false, false);
  const room2 = new FireRoom(firebase, 'user2', false, false);
  const room3 = new FireRoom(firebase, 'user3', false, false);
  
  it('each room gets a new peer connection', function ( done ) {
    let responses = {
      'user1' : {},
      'user2' : {},
      'user3' : {}
    };
    
    room.connect(roomId);
    room2.connect(roomId);
    room3.connect(roomId);
     
    room.on("peer_connected", (peerId)=>{
      responses['user1'][peerId]=true;
    });
    room2.on("peer_connected", (peerId)=>{
      responses['user2'][peerId]=true;
    });
    room3.on("peer_connected", (peerId)=>{
      responses['user3'][peerId]=true;
    });
        
    setTimeout(function() {
      expect(Object.keys(responses['user1']).length).toBe(2);
      expect(Object.keys(responses['user2']).length).toBe(2);
      expect(Object.keys(responses['user3']).length).toBe(2);
      done();
    }, 700);
  });
  
  after('Disconnecting...',function(){
    room.disconnect();
    room2.disconnect();
    room3.disconnect();
  });
});

xdescribe('When two peers join the same room and a user mutes their microphone', function () {
  const roomId = ('room' + Math.random()).replace(".","");
  const room = new FireRoom(firebase, 'user1', false, false);
  const room2 = new FireRoom(firebase, 'user2', false, false);
  
  it('recieves an event notifying the user she is muted', function ( done ) {
    
    room.connect(roomId);
    
    room2.connect(roomId);
    
    room.on("muted", function(){
      done();
    });
    
    room2.on("muted", function(){
      done(new Error("No event should be sent to user2"));
    });
    
    setTimeout(function() {
      room.muteMyMicrophone(true);
    }, 700);
  });
  
  afterEach('Disconnecting...',function(){
    room.disconnect();
    room2.disconnect();
  });
});


xdescribe('When two peers join the same room and a user mutes their camera', function () {
  const roomId = ('room' + Math.random()).replace(".","");
  const room = new FireRoom(firebase, 'user1', false, false);
  const room2 = new FireRoom(firebase, 'user2', false, false);
  
  it('recieves an event notifying the user her camera is muted', function ( done ) {
    
    room.connect(roomId);
    
    room2.connect(roomId);
    
    room.on("video_muted", function(){
      done();
    });
    
    room2.on("video_muted", function(){
      done(new Error("No event should be sent to user2"));
    });
    
    setTimeout(function() {
      room.muteMyCamera(true);
    }, 700);
  });
  
  afterEach('Disconnecting...',function(){
    room.disconnect();
    room2.disconnect();
  });
});


describe('When two peers join the same room and one of the users leaves.', function () {
  const roomId = ('room' + Math.random()).replace(".","");
  const room = new FireRoom(firebase, 'user1', false, false);
  const room2 = new FireRoom(firebase, 'user2', false, false);
  
  it('the remaining user is told of the disconnect.', function ( done ) {
    
    room.connect(roomId);
    room.on("peer_disconnected", function (peerid) {
      console.log("User1 got dis from "+peerid);
    });
    room2.connect(roomId);
    room2.on("peer_disconnected", function (peerid) {
      console.log("User2 got dis from "+peerid);
    });
    setTimeout(function() {
      room2.disconnect();
    }, 700);
    
    setTimeout(function() {
      
      room.removeAllListeners();
      room2.removeAllListeners();
      done();
    }, 1200);
    
    
  });
  
  afterEach('Disconnecting...',function(){
    room.disconnect();
  });
});