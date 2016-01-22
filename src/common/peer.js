import PeerJS from 'peerjs'

const PeerAPIKey = '2m6zy62x8t1emi';

export default class Peer extends PeerJS {
  constructor() {
    return super({key: PeerAPIKey, debug: 3})
  }


}
