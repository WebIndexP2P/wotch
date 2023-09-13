var stopPlayFunc = function(vnode) {
  console.log('stopping video')
  document.getElementById("popupviewer").src = "about:blank"
}

export default {
  oninit: (vnode)=>{
    if (typeof vnode.attrs.setStopPlayFunc == 'function') {
      vnode.attrs.setStopPlayFunc(stopPlayFunc.bind(null, vnode))
    }

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("iframe", {width:"100%",
      src: vnode.attrs.videoUrl,
      title: "Video player",
      frameborder:"0", 
      allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;",
      allowfullscreen: true,
      style:"border-radius:5px;height:80vh;background-color:#000;",
      id:"popupviewer",      
    })
  }
}