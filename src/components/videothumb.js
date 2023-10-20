import MakeBlockies from 'ethereum-blockies'
import Utils from '../lib/utils.js'
import ModalManager from '../lib/modalmanager.js'
import PopupViewer from './popupviewer.js'
import {AvatarImg} from 'wip2p-settings'
import * as libwip2p from 'libwip2p'
import AppState from '../lib/appstate.js'

var popupPlay = function(vnode, videoUrl, e) {
  e.preventDefault()
  let stopPlayFunc
  let setStopPlayFuncCallback = function(cb){
    stopPlayFunc = cb
  }
  let opts = {
    large: true,
    onHide: ()=>{
      if (typeof stopPlayFunc == 'function') {
        stopPlayFunc()
      } else {
        console.log('no stopPlayFunc found')
      }
    }
  }
  ModalManager.show({view: ()=>m(PopupViewer, {videoUrl: videoUrl, setStopPlayFunc: setStopPlayFuncCallback })}, opts)
}

export default {
  oninit: (vnode)=>{
    vnode.state.did = null
    vnode.state.didPromiseControls = null

    Object.seal(vnode.state)

    new Promise((resolve, reject)=>{
      vnode.state.didPromiseControls = {resolve, reject}
      // ensure we have a connection
      if (libwip2p.Peers.getConnState() != 4) {
        // subscribe to connection event
        libwip2p.Peers.events.on("connstatechange", function(data){
          let state = data[0];
          if (state == 4) {
            resolve();
          }
        })
        // maybe a timeout??
      } else {
        resolve();
      }
    })
    .then(()=>{
      return libwip2p.DIDLoader.loadBatch([vnode.attrs.video.owner])      
    })
    .then(()=>{
      vnode.state.did = libwip2p.DIDLoader.get(vnode.attrs.video.owner)
      m.redraw()
    })
    .catch((err)=>{
      //console.log(err)
    })
  },
  onremove: (vnode)=>{
    vnode.state.didPromiseControls.reject('cancelled')
  },
  view: (vnode)=>{

    let displayOwner = vnode.attrs.video.owner.substring(0,6) + "..." + vnode.attrs.video.owner.substring(38,42)
    let avatarImg = m("img", {src: MakeBlockies(vnode.attrs.video.owner), style:"height:32px;width:32px;border-radius:50%;margin-right:10px;"})
    if (vnode.state.did != null) {
      if (vnode.state.did.nickname != null) {
        displayOwner = vnode.state.did.nickname
      }
      if (vnode.state.did.avatar != null) {
        avatarImg = m("span", {style:"margin-right:5px;"}, m(AvatarImg, {cid: vnode.state.did.avatar, borderRadius:"50%"}))
      }
    }
    let targetUrl
    if (vnode.attrs.video.hasOwnProperty("yt_id") && vnode.attrs.video.yt_id != null) {
      targetUrl = "https://www.youtube.com/watch?v=" + vnode.attrs.video.yt_id
    } else if (vnode.attrs.video.hasOwnProperty("youtube") && vnode.attrs.video.youtube != null) {
      targetUrl = "https://www.youtube.com/watch?v=" + vnode.attrs.video.youtube
    } else if (vnode.attrs.video.hasOwnProperty("rumble") && vnode.attrs.video.rumble != null) {
      targetUrl = "https://rumble.com/" + vnode.attrs.video.rumble
    } else if (vnode.attrs.video.hasOwnProperty("ipfs") && vnode.attrs.video.ipfs != null) {
      targetUrl = window.preferedIpfsGateway + vnode.attrs.video.ipfs
    } else if (vnode.attrs.video.hasOwnProperty("twitter") && vnode.attrs.video.twitter != null) {
      targetUrl = "https://twitter.com/" + vnode.attrs.video.twitter
    }

    let d = new Date(vnode.attrs.video.timestamp * 1000)
    let humanTimestamp = Utils.secondsToHuman((Date.now() / 1000) - vnode.attrs.video.timestamp)
    let tooltipTimestamp = Utils.dateSimpleFormat(d)
    if (!vnode.attrs.video.hasOwnProperty("timestamp") || vnode.attrs.video.timestamp == 0) {
      humanTimestamp = ""
    } else {
      humanTimestamp += " ago"
    }

    let targetGateway = AppState.getGatewayForAddress(vnode.attrs.video.owner)

    return m("div.col-12 col-md-6 col-lg-5 col-xl-4 col-xxl-3 mb-4 d-flex align-items-stretch",
      m("a", {target:"_blank", href: targetUrl, style:"text-decoration:none;width:100%;"},
        m("div.ratio ratio-16x9",
          m("img", {src: targetGateway + vnode.attrs.video.thumb, style:"width:100%;object-fit:cover;border-radius:10px;"})
        ),                
        m("div.text-white mt-1", {style:"font-weight:bold;font-size:10pt;"}, vnode.attrs.video.title),                
        m("div.mt-1",
          m("div.float-end",
            (()=>{
              let sources = []

              //console.log(vnode.attrs.video)
                                
              if (vnode.attrs.video.youtube != null) {
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, "https://www.youtube.com/embed/" + vnode.attrs.video.youtube)},
                  m("img", {src:"assets/yt_32.png", style:"height:24px;width:24px;", title:"Youtube"})
                ))          
              }
              if (vnode.attrs.video.rumbed != null) {
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, "https://rumble.com/embed/" + vnode.attrs.video.rumbed)},
                  m("img", {src:"assets/rum_32.png", style:"height:16px;width:16px;", title:"Rumble"})
                ))
              }
              if (vnode.attrs.video.rumble != null && vnode.attrs.video.rumbed == null) {
                sources.push(m("a.me-1", {target:"_blank", href: "https://rumble.com/" + vnode.attrs.video.rumble},
                  m("img.me-1", {src:"assets/rum_32.png", style:"height:16px;width:16px;", title:"Rumble"})
                ))
              }
              if (vnode.attrs.video.ipfs != null) {
                let tmpIpfsGateway = AppState.getGatewayForAddress(vnode.attrs.video.owner)
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, tmpIpfsGateway + vnode.attrs.video.ipfs)},
                  m("img", {src:"assets/ipfs.png", style:"height:16px;width:16px;", title:"IPFS"})
                ))
              }
              if (vnode.attrs.video.twitter != null) {
                sources.push(m("a.me-1", {target:"_blank", href: "https://twitter.com/" + vnode.attrs.video.twitter},
                  m("img.me-1", {src:"assets/twitter_32.png", style:"height:16px;width:16px;", title:"Twitter"})
                ))
              }
              if (vnode.attrs.video.bitchute != null) {
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, "https://bitchute.com/embed/" + vnode.attrs.video.bitchute + "/")},
                  m("img", {src:"assets/bitchute.webp", style:"height:16px;width:16px;", title:"Bitchute"})
                ))
              }
              if (vnode.attrs.video.odysee != null) {
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, "https://odysee.com/$/embed/" + vnode.attrs.video.odysee)},
                  m("img", {src:"assets/odysee.png", style:"height:16px;width:16px;", title:"Odysee"})
                ))
              }
              if (vnode.attrs.video.brighteon != null) {
                sources.push(m("a.me-1", {href:"#", onclick: popupPlay.bind(null, vnode, "https://www.brighteon.com/embed/" + vnode.attrs.video.brighteon)},
                  m("img", {src:"assets/brighteon.png", style:"height:16px;width:16px;", title:"Brighteon"})
                ))
              }
              return sources
            })()
          ),
          m("div", {style:"display:inline-block;"}, avatarImg),
          m("div.align-middle", {style:"display:inline-block;"},
            m("div", {title: vnode.state.myAddress, style:"padding-top:0px;margin-top:0px;"}, m("span.text-white", {style:"font-weight:bold;font-size:10pt;"}, displayOwner)),
            m("div", {title: tooltipTimestamp, style:"line-height:1;"}, m("span.text-white", {style:"font-size:10pt;"}, humanTimestamp))
          )                  
        )
      )
    )
  }
}