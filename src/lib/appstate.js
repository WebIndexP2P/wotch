import * as libwip2p from 'libwip2p'
import * as libipfs from 'libipfs'
import CachedVideo from './cachedvideo.js'
let Buffer = libipfs.buffer.Buffer

var appVariables = {
  "suggested_channels_alias": "wotch_suggestions"
}

var addressStats = {} // { address: videosByTimestamp, maxId, lastLoadedId, playlistRootCid, indexDepth, loadStatus, suggestedGateways, useFallback }
var videosByTimestamp = []
var loadErrorCids = {} // {cid: true}
var events = new libwip2p.CustomEventEmitter()
var suggestedChannels = null

var process = async function(address, db, linkedSet) {

  address = address.toLowerCase()

  // remove all existing videos for this address
  let newVideoArray = []
  for (let a = 0; a < videosByTimestamp.length; a++) {
    if (videosByTimestamp[a].owner != address) {
      newVideoArray.push(videosByTimestamp[a])
    }
  }
  videosByTimestamp = newVideoArray
  newVideoArray = null

  console.log('AppState -> process()')
  let wotchRoot = await linkedSet.getContentByPath("/wotch", {useCidFetcher: true})  
  if (wotchRoot != null && wotchRoot.playlist_ipfs != null) {
    let playlistRootCid = wotchRoot.playlist_ipfs
    addressStats[address] = {playlistRootCid: playlistRootCid, loadStatus: 'loading', videosByTimestamp:[], useFallback: false}
    if (wotchRoot.hasOwnProperty('gws')) {
      addressStats[address].suggestedGateways = wotchRoot.gws
    }
    //console.log(playlistRootCid)
    let tmpIpfsGateway = getGatewayForAddress(address)
    //console.log(tmpIpfsGateway)
    let tmpVideos = await fetchPartialVideos(playlistRootCid, 'fromEnd', null, tmpIpfsGateway)
    .catch((err)=>{
      addressStats[address].loadStatus = 'failed'
      addressStats[address].useFallback = true
    })
    if (tmpVideos != null) {
      addNewVids(tmpVideos, address)
      addressStats[address].loadStatus = 'idle'
    }    

    //console.log(addressStats)
    
    //events.emit('stateupdated')
  }
  
  return []
}

var addNewVids = function(newVids, address) {

  if (newVids == null) {
    throw new Error('newVids cannot be null')
  }

  let channelVideosByTimestamp = addressStats[address].videosByTimestamp
  if (channelVideosByTimestamp == null) {
    channelVideosByTimestamp = []
    addressStats[address].videosByTimestamp = channelVideosByTimestamp
  }

  for (let a = 0; a < newVids.length; a++) {
    newVids[a].owner = address
    let cachedVid = CachedVideo.parse(newVids[a])
    videosByTimestamp.push(cachedVid)
    channelVideosByTimestamp.push(cachedVid)
  }
  if (newVids.length == 0) {
    return
  }
  addressStats[address].lastLoadedId = videosByTimestamp[videosByTimestamp.length-1].wotchId
  addressStats[address].lastLoadedTimestamp = videosByTimestamp[videosByTimestamp.length-1].timestamp
  if (addressStats[address].indexDepth == null) {
    addressStats[address].indexDepth = addressStats[address].lastLoadedId.toString().length
  }
  if (addressStats[address].maxId == null) {
    addressStats[address].maxId = parseInt(newVids[0].index)
  }
  videosByTimestamp.sort((a, b)=>b.timestamp - a.timestamp)
  channelVideosByTimestamp.sort((a, b)=>b.timestamp - a.timestamp)

  //console.log(addressStats)
}

var getVideosPaginated = async function(page, numPerPage) {
  //console.log('getVideosPaginated ' + page + ' ' + numPerPage)
  // loop through our videos by timestamp
  // if we reach a channel that its their last loaded video, we need to fetch another 10
  // never leave a channel with no unused videos
  //if (ipfsFetchInProgress) {
  //  console.log('fetch in progress, quiting')
  //  return []
  //}

  let pagedResults = []

  let startIdx = (page - 1) * numPerPage
  let lastVideoOnPageIdx = startIdx + numPerPage
  if (lastVideoOnPageIdx >= videosByTimestamp.length) {
    lastVideoOnPageIdx = videosByTimestamp.length - 1
  }
  let cutOffTimestamp
  if (videosByTimestamp.length > 0) {
    cutOffTimestamp = videosByTimestamp[lastVideoOnPageIdx].timestamp
  }  

  // we need to check if there are accounts that haven't been scanned up to the current timestamp
  //if (videosByTimestamp.length > startIdx) {    
    for (let address in addressStats) {
      let tmpAddressStats = addressStats[address]
      while (tmpAddressStats.lastLoadedTimestamp >= cutOffTimestamp) {
        //console.log(JSON.stringify(tmpAddressStats))        
        if (tmpAddressStats.lastLoadedId == 0) {
          break
        }        

        //videosByTimestamp[startIdx + numPerPage].timestamp
        //console.log('cutOffTimestamp = ' + cutOffTimestamp + ' ' + new Date(cutOffTimestamp * 1000))

        //console.log('we gonna load some more for ' + address)
        let startIndex = (tmpAddressStats.lastLoadedId - 1).toString()
        startIndex = startIndex.padStart(tmpAddressStats.indexDepth, "0")
        tmpAddressStats.loadStatus = 'loading'
        let tmpIpfsGateway = getGatewayForAddress(address)
        //console.log(tmpIpfsGateway)
        let tmpVideos = await fetchPartialVideos(tmpAddressStats.playlistRootCid, startIndex, null, tmpIpfsGateway)
        .catch((err)=>{
          addressStats[address].loadStatus = 'failed'
          addressStats[address].useFallback = true
        })
        if (tmpVideos != null) {
          addNewVids(tmpVideos, address)
          tmpAddressStats.loadStatus = 'idle'
        }
        
        // update the cutoff timestamp
        lastVideoOnPageIdx = startIdx + numPerPage
        if (lastVideoOnPageIdx >= videosByTimestamp.length) {
          lastVideoOnPageIdx = videosByTimestamp.length - 1
        }
        cutOffTimestamp = videosByTimestamp[lastVideoOnPageIdx].timestamp
      }
    }
  //}

  for (let a = startIdx; a < videosByTimestamp.length; a++) {
    pagedResults.push(videosByTimestamp[a])    
    if (pagedResults.length >= numPerPage) {
      break
    }
  }
  
  //console.log(addressStats)
  //events.emit('stateupdated')
  return pagedResults
}

var getVideosForAddressPaginated = async function(page, numPerPage, address) {
  //console.log('getVideosForAddressPaginated ' + page + ' ' + numPerPage + ' ' + address)
  //if (ipfsFetchInProgress) {
  //  console.log('fetch in progress, quiting')
  //  return []
  //}

  address = address.toLowerCase()
  let pagedResults = []
  let startIdx = (page - 1) * numPerPage
  let tmpAddressStats = addressStats[address]

  let targetGateway = getGatewayForAddress(address)

  if (tmpAddressStats == null) {
    return []
  }

  tmpAddressStats.loadStatus = 'loading'
  while (tmpAddressStats.videosByTimestamp.length < startIdx + numPerPage && tmpAddressStats.lastLoadedId != 0) {
    let startIndex
    if (!tmpAddressStats.hasOwnProperty('lastLoadedId') || tmpAddressStats.lastLoadedId == null) {
      startIndex = 'fromEnd'
    } else {  
      startIndex = (tmpAddressStats.lastLoadedId - 1).toString()
      startIndex = startIndex.padStart(tmpAddressStats.indexDepth, "0")
    }
    let tmpVideos = await fetchPartialVideos(tmpAddressStats.playlistRootCid, startIndex, null, targetGateway)
    .catch((err)=>{
      console.log('error detected')
      addressStats[address].loadStatus = 'failed'
      addressStats[address].useFallback = true
    })
    if (tmpVideos == null || tmpVideos.length == 0) {
      console.log('breaking')
      break
    }
    addNewVids(tmpVideos, address)    
  }
  if (addressStats[address].loadStatus != 'failed') {
    tmpAddressStats.loadStatus = 'idle'
  }

  for (let a = startIdx; a < tmpAddressStats.videosByTimestamp.length; a++) {
    pagedResults.push(tmpAddressStats.videosByTimestamp[a])
    if (pagedResults.length >= numPerPage) {
      break
    }    
  }
  
  //console.log(addressStats)
  //events.emit('stateupdated')
  return pagedResults
}

var getCachedVideoCount = function() {
  return videosByTimestamp.length
}

var getChannelCachedVideoCount = function(address) {
  if (address == null) {
    throw new Error("address cannot be null")
  }
  address = address.toLowerCase()
  if (!addressStats.hasOwnProperty(address) || !addressStats[address].hasOwnProperty('videosByTimestamp')) {
    return 0
  }
  return addressStats[address].videosByTimestamp.length
}


var fetchPartialVideos = async function(cid, startFrom, indexPrefix, ipfsGateway) {
  //console.log('fetchPartialVideos ' + cid + ' ' + startFrom + ' ' + indexPrefix + ' ' + ipfsGateway)

  if (cid === NaN) {
    console.log('uh oh')
    throw new Error("cid cannot be null")
  }

  if (cid == null) {
    throw new Error("cid cannot be null")
  }
  if (ipfsGateway == null) {
    throw new Error("ipfsGateway cannot be null")
  }
  if (loadErrorCids.hasOwnProperty(cid)) {
    return []
  }

  //ipfsFetchInProgress = true
  
  let results= []

  if (indexPrefix == null) {
    indexPrefix = ""
  }

  if (typeof startFrom != 'string') {
    throw new Error("startFrom index has to be a string")
  }

  console.log('fetching from ipfs ' + cid)
  return fetch(ipfsGateway + cid + "?format=raw")
  .then((response)=>{
    if (response.status != 200) {
      throw new Error("fetch from ipfs failed")
    }
    return response.arrayBuffer()
  })
  .then(async (dagBuffer)=>{
    let bDag = Buffer.from(dagBuffer)
    let doc = libipfs.dagCbor.decode(bDag)

    //detect if its a linked node or a leaf node
    let nodeMode = 'leaf'
    for (let prop in doc) {
      if (doc[prop][Symbol.toStringTag] == 'CID') {
        nodeMode = 'linked'
      }
      break
    }

    //console.log('nodeMode = ' + nodeMode)

    if (nodeMode == "leaf") {
      //console.log('doin new leaf node logic')
      let startIdx
      if (startFrom == 'fromEnd') {
        // get last index item
        startIdx = 0
        for (let prop in doc) {
          if (parseInt(prop) > startIdx) {
            startIdx = prop
          }
        }
      } else {
        // check if specified index exists
        if (doc.hasOwnProperty(startFrom) == false) {
          throw new Error("missing key " + startFrom)
        }
        startIdx = startFrom
      }
      // fill results with videos
      for (let a = parseInt(startIdx); a >= 0; a--) {
        let aStr = a.toString()
        let tmpVid = doc[aStr]
        tmpVid.index = indexPrefix + aStr
        results.push(tmpVid)
      }      
      return results
    } else {
      //console.log('doin new linked node logic')
      let startIdx
      if (startFrom == 'fromEnd') {
        // get last index item
        startIdx = 0
        for (let prop in doc) {
          if (parseInt(prop) > startIdx) {
            startIdx = prop
          }
        }
      } else {
        startIdx = startFrom.substring(0, 1)
        if (doc.hasOwnProperty(startIdx) == false) {
          throw new Error("missing key " + startIdx)
        }
      }
      // we have the startIdx, lets loop
      let newStartFrom
      if (startFrom == 'fromEnd') {
        newStartFrom = startFrom
      } else {
        newStartFrom = startFrom.substring(1)
      }
      /*for (let a = parseInt(startIdx); a >= 0; a--) {
        let aStr = a.toString()
        let tmpCid = doc[aStr]        
        return fetchPartialVideos(tmpCid.toString(), newStartFrom, indexPrefix + aStr, ipfsGateway)
      }*/
      let tmpCid = doc[startIdx]
      return fetchPartialVideos(tmpCid.toString(), newStartFrom, indexPrefix + startIdx, ipfsGateway)
      //return results
    }
  })
  .then((results)=>{
    //ipfsFetchInProgress = false
    return results
  })
  /*.catch((err)=>{
    ipfsFetchInProgress = false
    console.warn(err)
    loadErrorCids[cid] = true
    throw new Error("fetchFailed")
  })*/
}

var fetchPartialVideosWithLimit = function(cid, startFrom, fetchCount, indexPrefix) {
  //console.log('fetchPartialVideos ' + cid + ' ' + startFrom + ' ' + fetchCount)

  if (loadErrorCids.hasOwnProperty(cid)) {
    return []
  }

  let results= []

  if (indexPrefix == null) {
    indexPrefix = ""
  }

  if (typeof startFrom != 'string') {
    startFrom = startFrom.toString()
  }

  return fetch(preferedIpfsGateway + cid + "?format=raw")
  .then((response)=>{
    return response.arrayBuffer()
  })
  .then(async (dagBuffer)=>{
    let bDag = Buffer.from(dagBuffer)
    let doc = libipfs.dagCbor.decode(bDag)

    //detect if its a linked node or a leaf node
    let nodeMode = 'leaf'
    for (let prop in doc) {
      if (doc[prop][Symbol.toStringTag] == 'CID') {
        nodeMode = 'linked'
      }
      break
    }

    //console.log('nodeMode = ' + nodeMode)

    if (nodeMode == "leaf") {
      //console.log('doin new leaf node logic')
      let startIdx
      if (startFrom == 'fromEnd') {
        // get last index item
        startIdx = 0
        for (let prop in doc) {
          if (parseInt(prop) > startIdx) {
            startIdx = prop
          }
        }
      } else {
        // check if specified index exists
        if (doc.hasOwnProperty(startFrom) == false) {
          throw new Error("missing key " + startFrom)
        }
        startIdx = startFrom
      }
      // fill results with videos
      for (let a = parseInt(startIdx); a >= 0; a--) {
        let aStr = a.toString()
        let tmpVid = doc[aStr]
        tmpVid.index = indexPrefix + aStr
        results.push(tmpVid)
        if (results.length >= fetchCount) {
          break
        }
      }
      return results
    } else {
      //console.log('doin new linked node logic')
      let startIdx
      if (startFrom == 'fromEnd') {
        // get last index item
        startIdx = 0
        for (let prop in doc) {
          if (parseInt(prop) > startIdx) {
            startIdx = prop
          }
        }
      } else {
        if (indexPrefix.length == 0 && startFrom.length == 1) {
          console.log('FIXME: what to do if two levels of zero!')
          startFrom = "0" + startFrom
        }
        startIdx = startFrom.substring(0, 1)
        if (doc.hasOwnProperty(startIdx) == false) {
          throw new Error("missing key " + startIdx)
        }
      }
      // we have the startIdx, lets loop
      let newStartFrom
      if (startFrom == 'fromEnd') {
        newStartFrom = startFrom
      } else {
        newStartFrom = startFrom.substring(1)
      }
      for (let a = parseInt(startIdx); a >= 0; a--) {
        let aStr = a.toString()
        let tmpCid = doc[aStr]        
        let tmpResults = await fetchPartialVideos(tmpCid.toString(), newStartFrom, fetchCount - results.length, indexPrefix + aStr)
        if (tmpResults != null) {
          for (let a = 0; a < tmpResults.length; a++) {
            results.push(tmpResults[a])
            if (results.length >= fetchCount) {
              break
            }
          }
        }
        if (results.length >= fetchCount) {
          break
        }
        // we've looped to next doc, go to end
        newStartFrom = "fromEnd"
      }

      return results
    }
  })
  .catch((err)=>{
    console.error(err)
    loadErrorCids[cid] = true
  })
}

var onUpdate = function(callback) {
  return events.on("stateupdated", callback)
}

var removeOnUpdate = function(cbId) {
  events.off("stateupdated", cbId)
}

var debug = function() {
  console.log(videosByTimestamp)
  console.log(addressStats)
}

var hasAddress = function(address) {
  address = address.toLowerCase()
  return addressStats.hasOwnProperty(address)
}

var getAddressStatus = function(address) {
  address = address.toLowerCase()
  if (!addressStats.hasOwnProperty(address)) {
    return
  }
  return addressStats[address].loadStatus
}

var hasUnscannedVideos = function() {
  for (let address in addressStats) {
    if (addressStats[address].lastLoadedId != 0) {
      return true
    }
  }
  return false
}

var hasUnscannedVideosForChannel = function(address) {
  address = address.toLowerCase()
  if (!addressStats.hasOwnProperty(address)) {
    return false
  }
  if (addressStats[address].lastLoadedId != 0) {
    return true
  }
}

var getAppVariables = function() {
  return appVariables
}

var getSuggestedChannels = function() {
  if (suggestedChannels == null) {
    suggestedChannels = []    
    let ls = new libwip2p.LinkedSet()
    return ls.fetch(appVariables.suggested_channels_alias)
    .then((response)=>{
      for (let a = 0; a < response.length; a++) {
        let addr = '0x' + response[a].toString('hex')
        suggestedChannels.push(addr)
      }
      return suggestedChannels
    })
  } else {
    return new Promise((resolve, reject)=>{
      resolve(suggestedChannels)
    })
  }
}

var getGatewayForAddress = function(address) {
  address = address.toLowerCase()
  if (addressStats.hasOwnProperty(address)) {    
    if (addressStats[address].useFallback) { 
      return window.preferedIpfsGateway
    }
    if (addressStats[address].hasOwnProperty('suggestedGateways') && addressStats[address].suggestedGateways.length > 0) {
      return addressStats[address].suggestedGateways[0]
    }
    return window.preferedIpfsGateway
  } else {
    return window.preferedIpfsGateway
  }
}

var retryInitialFetch = async function(address) {
  address = address.toLowerCase()
  if (!addressStats.hasOwnProperty(address)) {
    return
  }
  let targetGateway = getGatewayForAddress(address)
  return fetchPartialVideos(addressStats[address].playlistRootCid, 'fromEnd', null, targetGateway)
  .then((tmpVideos)=>{
    addNewVids(tmpVideos, address)
    addressStats[address].loadStatus = 'idle'
  })
}

export default {
  process,
  getAppVariables,
  getVideosPaginated,
  getVideosForAddressPaginated,
  getCachedVideoCount,
  getChannelCachedVideoCount,
  onUpdate,
  removeOnUpdate,
  debug,
  hasAddress,
  hasUnscannedVideos,
  hasUnscannedVideosForChannel,
  getSuggestedChannels,
  getGatewayForAddress,
  getAddressStatus,
  retryInitialFetch
}