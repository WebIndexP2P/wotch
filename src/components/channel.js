import * as libwip2p from 'libwip2p'
import { ethers } from 'ethers'
import AppState from '../lib/appstate.js'
import VideoThumb from './videothumb.js'
import Pagination from './pagination.js'

var updatePageResults = function(vnode) {
  AppState.getVideosForAddressPaginated(vnode.state.page, vnode.state.numRowsPerPage, vnode.state.targetAddress)
  .then((results)=>{
    //console.log(results)
    vnode.state.pageResults = results
    vnode.state.cachedVideoCount = AppState.getChannelCachedVideoCount(vnode.state.targetAddress)
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    m.redraw()
  })
}


export default {

  oninit: (vnode)=>{
    vnode.state.page = 1
    vnode.state.pageResults = []
    vnode.state.did = null
    vnode.state.cachedVideoCount = 0
    vnode.state.pageCount = 0
    vnode.state.numRowsPerPage = 12
    vnode.state.appStateEventListener = null

    vnode.state.targetAddress = m.route.param().address
    if (!ethers.isAddress(vnode.state.targetAddress)) {
      m.route.set("/")
    }

    Object.seal(vnode.state)

    if (m.route.param().page == null) {
      vnode.state.page = 1
    } else {
      vnode.state.page = parseInt(m.route.param().page)
    }

    vnode.state.appStateEventListener = AppState.onUpdate(()=>{
      updatePageResults(vnode)
    })

    libwip2p.Loader.fetchOne(vnode.state.targetAddress)
    .then(async (response)=>{
      vnode.state.pageResults = await AppState.getVideosForAddressPaginated(vnode.state.page, 12, vnode.state.targetAddress)
      updatePageResults(vnode)
    })
    .then(()=>{
      return libwip2p.DIDLoader.loadBatch([vnode.state.targetAddress])
      .then(()=>{
        vnode.state.did = libwip2p.DIDLoader.get(vnode.state.targetAddress)
        m.redraw()
      })
    })
  },
  onremove: (vnode)=>{
    AppState.removeOnUpdate(vnode.state.appStateEventListener)
  },
  view: function(vnode) {
    let hasUnscanned = AppState.hasUnscannedVideosForChannel(vnode.state.targetAddress)
    return m("div.container text-white",
      m(Pagination, {url:"/channel/" + vnode.state.targetAddress, page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: hasUnscanned}),
      m("div.row",
        (()=>{
          let cards = vnode.state.pageResults.map((video)=>{
            //console.log(video)
            return m(VideoThumb, {video: video, did: vnode.state.did})
          })
          if (cards.length > 0 && vnode.state.lastFetchedVideoId > 0) {
            cards.push(m("div.col-12 col-md-6 col-lg-5 col-xl-4 col-xxl-3 mb-4 d-flex align-items-stretch justify-content-center",
              m("div.d-flex align-items-center", 
                m("button.btn btn-primary", {onclick: loadMoreVideos.bind(null, vnode)}, m("i.fa fa-refresh"), " Load more")
              )
            ))
          }
          return cards
        })()
      ),
      m(Pagination, {url:"/channel/" + vnode.state.targetAddress, page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: hasUnscanned}),
    )
  }
}
