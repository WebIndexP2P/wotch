import ControlBar from './controlbar.js'
import Pagination from './pagination.js'
import VideoThumb from './videothumb.js'
import AppState from '../lib/appstate.js'
import * as libwip2p from 'libwip2p'

var updatePageResults = function(vnode) {
  AppState.getVideosPaginated(vnode.state.page, vnode.state.numRowsPerPage)
  .then(async (results)=>{
    //console.log(results)
    //AppState.debug()
    if (AppState.getAddressStatus(vnode.state.myAddress) == 'failed' && !vnode.state.triedFallbackGateway) {
      vnode.state.triedFallbackGateway = true
      return AppState.retryInitialFetch(vnode.state.myAddress)
      .then(()=>{
        updatePageResults(vnode)
      })
    }
    vnode.state.loading = false
    vnode.state.pageResults = results
    vnode.state.cachedVideoCount = AppState.getCachedVideoCount()
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    m.redraw()
  })
}

export default {
  oninit: (vnode)=>{
    vnode.state.numRowsPerPage = 12
    vnode.state.pageResults = []
    vnode.state.cachedVideoCount = AppState.getCachedVideoCount()    
    vnode.state.page = 0
    vnode.state.pageCount = 0
    vnode.state.appStateEventListener = null
    vnode.state.loading = true
    vnode.state.myAddress = libwip2p.Account.getWallet().address.toLowerCase()
    vnode.state.triedFallbackGateway = false

    Object.seal(vnode.state)

    if (m.route.param().page == null) {
      vnode.state.page = 1
    } else {
      vnode.state.page = parseInt(m.route.param().page)
    }
    if (vnode.state.cachedVideoCount > 0) {
      vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    } else {
      vnode.state.pageCount = 0
    }

    /*if (vnode.state.page > vnode.state.pageCount) {
      m.route.set("/")
    }*/

    vnode.state.appStateEventListener = AppState.onUpdate(()=>{
      updatePageResults(vnode)
    })

    //console.log('fetchOne ' + myAddress)
    libwip2p.Loader.fetchOne(vnode.state.myAddress)
    .then(()=>{
      updatePageResults(vnode)
    })

    Object.seal(vnode.state)
  },
  onremove: (vnode)=>{
    AppState.removeOnUpdate(vnode.state.appStateEventListener)
  },
  view: (vnode)=>{
    if (!vnode.state.loading && vnode.state.pageResults.length == 0) {
      return m("div.container text-white", 
        m(ControlBar),
        m("div", "No results")
      )
    }
    let hasUnscanned = AppState.hasUnscannedVideos()
    return m("div.container text-white", 
      m(ControlBar),
      m(Pagination, {url:"/unified", page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: hasUnscanned}),
      m("div.row",
        vnode.state.pageResults.map((video=>{
          return m(VideoThumb, {video: video, did: vnode.state.did})
        }))
      ),
      m(Pagination, {url:"/unified", page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: hasUnscanned})
    )
  }
}