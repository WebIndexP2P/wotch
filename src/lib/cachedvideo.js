// we have to assume that videos listed in the ipld index are chronological, and the timestamps should match but might not

var CachedVideo = function() {

  this.title = null
  this.thumb = null
  this.timestamp = null

  // internal
  this.owner = null
  this.wotchId = null

  // sources
  this.youtube = null
  this.twitter = null
  this.rumble = null
  this.rumbed = null
  this.brighteon = null
  this.odysee = null
  this.bitchute = null
  this.ipfs = null

  Object.seal(this)

  return this
}

CachedVideo.parse = function(data) {
  //console.log(data)
  let newVid = new CachedVideo()
  newVid.title = data.title
  newVid.thumb = data.thumb.toString()
  newVid.timestamp = data.timestamp
  newVid.wotchId = parseInt(data.index)
  newVid.owner = data.owner  

  if (data.hasOwnProperty('youtube')) {
    newVid.youtube = data.youtube
  }
  if (data.hasOwnProperty('twitter')) {
    newVid.twitter = data.twitter
  }
  if (data.hasOwnProperty('rumble')) {
    newVid.rumble = data.rumble
  }
  if (data.hasOwnProperty('rumbed')) {
    newVid.rumbed = data.rumbed
  }
  if (data.hasOwnProperty('brighteon')) {
    newVid.brighteon = data.brighteon
  }
  if (data.hasOwnProperty('odysee')) {
    newVid.odysee = data.odysee
  }
  if (data.hasOwnProperty('bitchute')) {
    newVid.bitchute = data.bitchute
  }
  if (data.hasOwnProperty('ipfs')) {
    newVid.ipfs = data.ipfs
  }

  return newVid
}

export default CachedVideo