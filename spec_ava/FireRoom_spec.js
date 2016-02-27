import test from 'ava';
import FireRoom from '../src/utilities/FireRoom';
import FireBase from 'firebase';

const appPath = 'https://lillywood.firebaseio.com';
const buildingPath = appPath+'/test';
const firebase = new Firebase(buildingPath);

test('basic connection', t => {
  t.plan(2);
  return new Promise(()=> {
    const room = new FireRoom(firebase, 'user1');
    room.connect('room');
    
    room.on("peer_connected", (peerId)=>{
      t.is( peerId, 'user2');
      console.log("boop1")
    });
    const room2 = new FireRoom(firebase, 'user2');
    room2.connect('room');
    
    room2.on("peer_connected", (peerId)=>{
      t.is( peerId, 'user1');
      console.log("boop2")
    });
    
    setTimeout(()=>{
      Promise.resolve();
    }, 500);
  });
});