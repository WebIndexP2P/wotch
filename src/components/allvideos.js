import PaginatedGrid from './paginatedgrid.js'
import ControlBar from './controlbar.js'

export default {

  oninit: (vnode)=>{

    Object.seal(vnode.state)
  },
  view: function(vnode) {
    return m("div.container text-white",
      m(ControlBar),
      m(PaginatedGrid)
    )
  }
}
