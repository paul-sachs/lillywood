var expect = require('expect');
import FireBase from 'firebase';

const appPath = 'https://lillywood.firebaseio.com';
const buildingPath = appPath+'/test';
const firebase = new Firebase(buildingPath);
import FireRoom from '../utilities/FireRoom'; 

describe('FireRoom', function () {
  it('Join two peers', function ( done ) {
    let counter = 0;
    const room = new FireRoom(firebase, 'user1', false, true);
    room.connect('room', true, true);
    room.on("peer_connected", (peerId)=>{
      counter ++;
      if(counter==2)
        done();
    });
    const room2 = new FireRoom(firebase, 'user2', false, true);
    room2.connect('room');
    
    room2.on("peer_connected", (peerId)=>{
      expect( peerId ).toBe('user1');
      counter ++;
      if(counter==2)
        done();
    });
    
    setTimeout(function() {
      done(new Error("Failed to connect"));
    }, 2000);
  });
});