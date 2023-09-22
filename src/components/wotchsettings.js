import AppState from '../lib/appstate.js'

var onSaveClick = function(vnode){
  AppState.getAppVariables().wotchsearch_endpoint = vnode.state.draftSearchApi
  localStorage.setItem("wotchsearchEndpoint", vnode.state.draftSearchApi)
  vnode.state.saveState = m("div.text-success", "Saved")
}

export default {
  oninit: (vnode)=>{
    vnode.state.saveState = null
    vnode.state.draftSearchApi = AppState.getAppVariables().wotchsearch_endpoint

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.card bg-light",
      m("div.card-body",
        m("div.mb-3",
          m("label", "WotchSearch API"),
          m("input.form-control", {type:"text", value: vnode.state.draftSearchApi, oninput: (e)=>{
            vnode.state.draftSearchApi = e.target.value
          }})
        ),
        m("button.btn btn-primary mb-3", {onclick: onSaveClick.bind(null, vnode)}, m("i.fa fa-save"), " Save"),
        vnode.state.saveState,
        m("div.mb-3",
          m("div", "Estimated videos in browser index: ", AppState.getEstimatedVideoCount())
        )
      )
    )
  }
}