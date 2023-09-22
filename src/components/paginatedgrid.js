import Pagination from './pagination.js'
import VideoThumb from './videothumb.js'
import AppState from '../lib/appstate.js'
import * as libwip2p from 'libwip2p'

var updatePageResultsForAddress = function(vnode) {
  libwip2p.Loader.fetchOne(vnode.attrs.channelAddress)
  .then(()=>{
    return AppState.getVideosForAddressPaginated(vnode.state.page, vnode.state.numRowsPerPage, vnode.attrs.channelAddress)
  })
  .then((results)=>{
    //console.log(results)
    vnode.state.loading = false
    vnode.state.pageResults = results
    vnode.state.cachedVideoCount = AppState.getChannelCachedVideoCount(vnode.attrs.channelAddress)
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    vnode.state.hasUnscanned = AppState.hasUnscannedVideosForChannel(vnode.attrs.channelAddress)
    //console.log(vnode.state)
    m.redraw()
  })  
}

var updatePageResults = function(vnode) {
  AppState.getVideosPaginated(vnode.state.page, vnode.state.numRowsPerPage)
  .then(async (results)=>{
    //console.log(results)
    vnode.state.loading = false
    vnode.state.pageResults = results
    vnode.state.cachedVideoCount = AppState.getCachedVideoCount()
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    vnode.state.hasUnscanned = AppState.hasUnscannedVideos()
    //console.log(vnode.state)
    m.redraw()
  })
}

var fetchFromWotchSearchIndex = function(vnode) {
  
  vnode.state.loading = true

  let wotchSearchEndpoint = AppState.getAppVariables().wotchsearch_endpoint
  let searchUrl = wotchSearchEndpoint + "/api/search?"
  if (vnode.attrs.hasOwnProperty("searchString") && vnode.attrs.searchString != "") {
    searchUrl += "q=" + vnode.attrs.searchString
  }
  if (vnode.state.page > 1) {
    if (!searchUrl.endsWith("?")) {
      searchUrl += "&"
    }
    searchUrl += "page=" + vnode.state.page
  }
  fetch(searchUrl)
  .then((results)=>{
    return results.json()
  })
  .then((response)=>{
    //console.log(response)
    vnode.state.loading = false
    vnode.state.pageResults = response.videos
    for (let address in response.gateways) {
      AppState.updateSuggestedGatewaysForAddress(address, response.gateways[address])
    }
    vnode.state.cachedVideoCount = response.resultCount
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    //console.log(vnode.state)
    m.redraw()
  })
  .catch((err)=>{
    console.log(err)
    vnode.state.loading = false
    vnode.state.showSearchApiOffline = true
    AppState.getAppVariables().wotchsearch_enabled = false
    m.redraw()
  })
}

var tryRenderOffline = function(vnode) {
  if (vnode.state.showSearchApiOffline) {
    if (m.route.get().startsWith("/search")) {
      return m("div.alert alert-warning", "WotchSearch API offline! Using local index instead.")
    } else {
      return m("div.alert alert-warning", "WotchSearch API offline! Use search button above to find content.")
    }    
  }
}

var onPageNavigate = function(vnode, newPage) {
  //console.log('onPageNavigate ' + newPage)
  vnode.state.page = newPage
  vnode.state.pageResults = []
  vnode.state.loading = true

  executeSearchType(vnode)
}

var executeSearchType = function(vnode) {
  if (vnode.attrs.hasOwnProperty("channelAddress")) {
    updatePageResultsForAddress(vnode)
  } else if (AppState.getAppVariables().wotchsearch_enabled) {
    fetchFromWotchSearchIndex(vnode)
  } else if (m.route.get().startsWith("/search")) {
    vnode.state.showSearchApiOffline = true
    let searchResults = AppState.localSearch(vnode.attrs.searchString, vnode.state.page, vnode.state.numRowsPerPage)    
    vnode.state.pageResults = searchResults.videos
    vnode.state.cachedVideoCount = searchResults.resultCount
    vnode.state.pageCount = Math.ceil(vnode.state.cachedVideoCount / vnode.state.numRowsPerPage)
    vnode.state.hasUnscanned = false
  } else {
    vnode.state.showSearchApiOffline = true
    updatePageResults(vnode)
  }
}

export default {
  oninit:(vnode)=>{
    vnode.state.loading = false
    vnode.state.numRowsPerPage = 12
    vnode.state.page = 1
    vnode.state.pageCount = 0
    vnode.state.pageResults = []
    vnode.state.cachedVideoCount = 0
    vnode.state.hasUnscanned = false
    vnode.state.showSearchApiOffline = false

    Object.seal(vnode.state)

    executeSearchType(vnode)
  },
  view: (vnode)=>{
    if (!vnode.state.loading && vnode.state.pageResults.length == 0) {
      return m("div", 
        tryRenderOffline(vnode),
        m("div", "No results")
      )
    }
    return m("div",
      tryRenderOffline(vnode),
      m(Pagination, {url:"/unified", page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: vnode.state.hasUnscanned, onPageNavigate: onPageNavigate.bind(null, vnode)}),
      m("div.row",
        vnode.state.pageResults.map((video)=>{
          return m(VideoThumb, {video: video, did: vnode.state.did})
        })
      ),
      m(Pagination, {url:"/unified", page: vnode.state.page, pageCount: vnode.state.pageCount, hasUnscanned: vnode.state.hasUnscanned, onPageNavigate: onPageNavigate.bind(null, vnode)})
    )
  }
}