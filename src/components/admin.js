import * as libipfs from 'libipfs'
import * as libwip2p from 'libwip2p'

let CID = libipfs.multiformats.CID
let Buffer = libipfs.buffer.Buffer

var verifyIpfsPlaylist = async function(vnode, e) {
  e.preventDefault()  

  vnode.state.importError = null
  vnode.state.fetchingStatus = null

  let cid
  try {
    cid = CID.parse(vnode.state.newRootCid)
  } catch (err) {
    console.error(err)
    vnode.state.importError = "Cid appears invalid"
    return
  }

  let maxVideoId = await getVideoCount(vnode, cid)
  let videoCount = parseInt(maxVideoId) + 1
  vnode.state.fetchingStatus = "Found " + videoCount + " videos"
  vnode.state.saveState = ""
  m.redraw()
}

var getVideoCount = function(vnode, cid) {
  vnode.state.fetchingStatus = m("span", m("b", "Fetching: "), cid.toString())
  m.redraw()

  return fetch(preferedIpfsGateway + cid + "?format=raw")
  .then((response)=>{
    return response.arrayBuffer()
  })
  .then(async (dagBuffer)=>{
    let bDag = Buffer.from(dagBuffer)
    let doc = libipfs.dagCbor.decode(bDag)

    let maxIdx = "";
    let link = null;
    for (let a = 9; a >= 0; a--) {
      if (doc.hasOwnProperty(a.toString())) {
        maxIdx = a.toString()
        if (doc[a.toString()][Symbol.toStringTag] == 'CID') {
          link = doc[a.toString()]
        }
        break
      }
    }

    if (link != null) {
      maxIdx += await getVideoCount(vnode, link)
    }
    return maxIdx
  })
  .catch((err)=>{
    vnode.state.importError = err.message
    m.redraw()
  })
}

var save = function(vnode, e) {  
  e.preventDefault()

  console.log('save')
  vnode.state.saveResult = null
  let myAddress = libwip2p.Account.getWallet().address.toLowerCase()
  
  let ls
  libwip2p.Loader.fetchOne(myAddress)
  .then((response)=>{
    ls = response.ls
    return ls.getContentByPath("/wotch", {useCidFetcher: true})
  })
  .then((wotchRoot)=>{
    if (wotchRoot == null) {
      wotchRoot = {}
    }
    if (vnode.state.newRootCid != null) {
      wotchRoot.playlist_ipfs = vnode.state.newRootCid
    }
    if (vnode.state.suggestedGateways.length > 0) {
      wotchRoot.gws = vnode.state.suggestedGateways
    } else {
      delete wotchRoot.gws
    }

    ls.update("/wotch", wotchRoot, {createIfMissing: true, createPathsAsLinks: true})
    return ls.sign()
  })
  .then(()=>{
    console.log('publishing')
    return ls.publish()
  })
  .then((response)=>{
    if (response.result = "ok") {
      vnode.state.saveResult = m("span.text-success", "Saved")
    } else {
      vnode.state.saveResult = JSON.stringify(response)
    }
    m.redraw()
  })
  .catch((err)=>{
    vnode.state.saveResult = err.message
    m.redraw()
  })
}

var addSuggestGateway = function(vnode) {
  vnode.state.addGatewayError = null
  if (/^https?:\/\//.test(vnode.state.draftGateway) == false) {
    vnode.state.addGatewayError = "expects http[s]://"
    return
  }
  vnode.state.suggestedGateways.push(vnode.state.draftGateway)
  vnode.state.draftGateway = ""
  vnode.state.saveState = ""
}

var removeGateway = function(vnode, idx, e) {
  e.preventDefault()
  vnode.state.suggestedGateways.splice(idx, 1)
  vnode.state.saveState = ""
}

export default {
  oninit: (vnode)=>{
    vnode.state.myAddress = libwip2p.Account.getWallet().address.toLowerCase()
    vnode.state.saveState = "disabled"
    vnode.state.newRootCid = ""
    vnode.state.draftGateway = ""
    vnode.state.importError = null
    vnode.state.fetchingStatus = null
    vnode.state.suggestedGateways = []
    vnode.state.addGatewayError = null
    vnode.state.originalRoot = null
    vnode.state.saveResult = null

    Object.seal(vnode.state)

    libwip2p.Loader.fetchOne(vnode.state.myAddress)
    .then((result)=>{
      let rootNode = result.ls.getContentByPath("/wotch")
      if (rootNode != null) {
        vnode.state.originalRoot = rootNode
        vnode.state.newRootCid = rootNode.playlist_ipfs
        if (Array.isArray(rootNode.gws)) {
          vnode.state.suggestedGateways = rootNode.gws
        }
      }
      m.redraw()
    })
  },
  view: (vnode)=>{
    return m("div.container text-white",
      m("div.row",
        m("div.col-md-11 col-lg-9 col-xl-8 col-xxl-7",
          m("label", "IPFS playlist CID"),
          m("div.input-group",
            m("input.form-control", {id:"playlistCid", type:"text", placeholder:"playlist CID", oninput: ()=>{}, value: vnode.state.newRootCid, oninput:(e)=>{
              vnode.state.newRootCid = e.target.value
            }}),
            m("button.btn btn-primary", {onclick: verifyIpfsPlaylist.bind(null, vnode)}, m("i.fa fa-circle-check"), " Verify")
          )
        ),
        (()=>{
          if (vnode.state.importError) {
            return m("div.text-danger", vnode.state.importError)
          } else {
            return m("div.text-success", vnode.state.fetchingStatus)
          }
        })()
      ),
      m("div.row mt-3",
        m("div.col-md-7 col-lg-6 col-xl-5 col-xxl-4",
          m("label", "Suggested IPFS Gateways for this channel content"),
          m("ul.list-group mt-2 mb-2",
            vnode.state.suggestedGateways.map((endpoint, idx)=>{
              return m("li.list-group-item", 
                endpoint,
                m("a.float-end", {href:"#", onclick: removeGateway.bind(null, vnode, idx)}, m("i.fa fa-trash"))
              )
            })
          ),
          m("div.input-group",
            m("input.form-control", {id:"newGateway", type:"text", placeholder:"https://ipfs.io/ipfs/", value: vnode.state.draftGateway, oninput:(e)=>{
              vnode.state.draftGateway = e.target.value
            }}),
            m("button.btn btn-primary", {onclick: addSuggestGateway.bind(null, vnode)}, m("i.fa fa-add"), " Add")
          ),
          m("div.text-danger", vnode.state.addGatewayError)
        )
      ),
      m("div.row mt-3",
        m("div.col",
          m("button.btn btn-primary " + vnode.state.saveState, {onclick: save.bind(null, vnode)}, m("i.fa fa-save"), " Save"),
          m("div", vnode.state.saveResult)
        )
      )
    )          
  }
}
