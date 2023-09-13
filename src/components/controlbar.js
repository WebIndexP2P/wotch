export default {
  view: (vnode)=>{
    return m("div",
      m("div.row",
        m("div.col-12",          
          m("button.btn btn-outline-secondary mb-2 me-2 disabled", m("i.fa fa-video"), " Add video"),
          m("button.btn btn-outline-secondary mb-2 me-2", {onclick: ()=>{m.route.set("/search")}}, m("i.fa fa-search"), " Search"),
          m("button.btn btn-outline-secondary mb-2 me-2", {onclick: ()=>{m.route.set("/admin")}}, m("i.fa fa-wrench"), " Channel Admin")
        )
      )
    )
  }
}