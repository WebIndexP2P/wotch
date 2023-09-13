import * as MithrilNav from './lib/mithrilnav.js'
import Version from './lib/version.js'
import PublicCheck from './lib/publiccheck.js'
import PageLayout from './components/layout/pagelayout.js'
import PageUnified from './components/unifiedview.js'
import PageChannel from './components/channel.js'
import PageSearch from './components/search.js'
import {SettingsVnode as PageSettings} from 'wip2p-settings'
import NoInviteModal from './components/noinvitemodal.js'
import DisconnectModal from './components/disconnectmodal.js'
import AppState from './lib/appstate.js'
import ModalManager from './lib/modalmanager.js'
import AlphaWarningModal from './components/alphawarning.js'
import PageAdmin from './components/admin.js'

import * as libwip2p from 'libwip2p'

libwip2p.Loader.setup({getNamespace:()=>{return "/wotch"},import:()=>{}}, AppState);

MithrilNav.overrideMithrilRouting();
MithrilNav.restoreScrollPositions();

window.logWebsocket = localStorage.getItem('logWebsocket');
if (window.logWebsocket == "true")
  window.logWebsocket = true;
else
  window.logWebsocket = false;

window.showDebugControls = localStorage.getItem('showDebugControls');
if (window.showDebugControls == "true")
  window.showDebugControls = true;
else
  window.showDebugControls = false;

window.preferedIpfsGateway = localStorage.getItem("preferedIpfsGateway")
if (window.preferedIpfsGateway == null || window.preferedIpfsGateway == "") {
  window.preferedIpfsGateway = "https://ipfs.io/ipfs/"
}

libwip2p.useLocalStorage(true);
libwip2p.Account.initWallet();

libwip2p.Peers.events.on("connstatechange", function(params){

  let state;
  let manualDisconnect;  

  if (Array.isArray(params)) {
    state = params[0]
    if (params.length > 1) {
      manualDisconnect = params[1]
    }
  }

  if (state == 3) {
    //console.log('show redeem invite screen');
    ModalManager.show(NoInviteModal)
  }

  if (state == 0 && !manualDisconnect) {
    ModalManager.show(DisconnectModal)
  }
})

if (localStorage.getItem('warning-dismiss') == null) {
  ModalManager.show(AlphaWarningModal);
}

libwip2p.Peers.init(null, libwip2p.Account.getWallet)
.then(()=>{
  if (window.location.hash.startsWith("#!/boot/")) {
    var bootPeer = window.location.hash.substring(8);
    return libwip2p.Peers.addPeer(bootPeer);
  } else {
    if (libwip2p.Peers.getPeers().length == 0) {
      return libwip2p.Peers.addPeer("wss://tulip.wip2p.com");
    }
  }
})
.then(()=>{
  // make sure we always subscribe to new bundle events
  libwip2p.Peers.events.on('peerconnected', function(){
    libwip2p.Peers.getActivePeerSession()
    .then((ps)=>{
      ps.onBundleReceived = function(bundle){
        console.log('bundle received from ' + bundle.account)
        //libwip2p.Loader.fetchOne(bundle.account, {replaceCache: true});
      }
    })
  })

  // load the UI
  var a = document.getElementById('app');

  let settingsConfig = {
    hideEth: true,
    _hideIpfs: true,
    name:"Wotch",
    version: "v" + Version,
    description: m("span", " is a p2p video indexing platform. Index videos from multiple platforms for one unified feed. All data is stored in ", m("a[href='https://wip2p.com']", {target:"_blank"}, "WebIndexP2P"), " nodes run by volunteers."),
    icon:"assets/app_192_rounded.png",
    _additionalTabs: [],
    theme: "dark"
  }

  m.route(a, "/", {
    "/": {render: function() {
      return m(PageLayout, {}, m(PageUnified))
    }},
    "/unified/:page": {render: function() {
      return m(PageLayout, {}, m(PageUnified, {key: m.route.param().page}))
    }},
    "/channel/:address": {render: function() {
      return m(PageLayout, {}, m(PageChannel, {key: m.route.param().address}))
    }},
    "/channel/:address/:page": {render: function() {
      let tmpKey = m.route.param().address + "_" + m.route.param().page
      return m(PageLayout, {}, m(PageChannel, {key: tmpKey}))
    }},
    "/search": {render: function() {
      return m(PageLayout, {}, m(PageSearch))
    }},
    "/admin": {render: function() {
      return m(PageLayout, {}, m(PageAdmin))
    }},
    "/settings": {render: function() {
        return m(PageLayout, {}, m(PageSettings, settingsConfig))
    }},
    "/settings/:tab": {render: function() {
      return m(PageLayout, {}, m(PageSettings, settingsConfig))
    }},
  })

  document.getElementsByClassName("loader")[0].classList.add('fadeout');

  //load root to see if public
  PublicCheck();
})
