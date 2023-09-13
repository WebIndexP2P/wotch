import PublicModeModal from '../components/publicmodemodal.js'
import * as libwip2p from 'libwip2p'

export default function() {
  new Promise((resolve, reject)=>{
    if (libwip2p.Peers.getConnState() != 4) {
      libwip2p.Peers.events.on("connstatechange", function(state){
        if (state == 4) {
          resolve();
        }
        if (state == 3) {
          reject('peer connection unauthorized');
        }
      })
    } else {
      resolve();
    }
  })
  .then(()=>{
    let peer = libwip2p.Peers.getActive()
    console.log('fetching from network - ' + peer.rootAccount);
    var ls = new libwip2p.LinkedSet();
    return ls.fetch(peer.rootAccount, "/wip2p")
  })
  .then((result)=>{
    if (result == null) {
      // it means no /wip2p found, which means its private
      return;
    }
    if (result.hasOwnProperty('public') && result.public) {
      m.mount(document.getElementsByClassName('modal-content')[0], PublicModeModal);
      var myModal = new bootstrap.Modal(document.getElementById('modal'));
      myModal.show();
    }
  })
  .catch((err)=>{
    console.log(err)
    if (err == 'account has not posted anything') {
    } else if (err == "unauthorized"){
      m.route.set("/settings?tab=invites");
    } else {
    }
  })
}