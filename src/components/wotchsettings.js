import AppState from '../lib/appstate.js'

export default {
  oninit: (vnode)=>{

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    return m("div.card bg-light",
      m("div.card-body",
        m("div.mb-3", 
          m("label", "??"),
          m("input.form-control", {type:"text"})
        ),
        m("button.btn btn-primary mb-3", m("i.fa fa-save"), " Save")
      )
    )
  }
}