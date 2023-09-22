import Suggestions from './suggestions.js'
import PaginatedGrid from './paginatedgrid.js'
import { ethers } from 'ethers'

var doSearch = function(vnode){
  
  let searchString = vnode.state.draftSearchString

  if (ethers.isAddress(searchString)) {
    m.route.set("/channel/" + searchString)
    return
  }

  m.route.set("/search/:q", {q: searchString})
}

export default{
  oninit: (vnode)=>{    
    vnode.state.draftSearchString = ""
    vnode.state.searchBegun = false
    vnode.state.searchString = m.route.param().q
    if (vnode.state.searchString != null) {
      vnode.state.draftSearchString = vnode.state.searchString
      vnode.state.searchBegun = true
    }
    Object.seal(vnode.state)
    
  },
  view: (vnode)=>{
    return m("div.container text-white",
      m("div.row mb-3",
        m("div.col-12",
          m("div.input-group",
            m("input.form-control", {type:"text", id:"searchText", style:"max-width:400px;", value: vnode.state.draftSearchString, onkeyup:(e)=>{
              vnode.state.draftSearchString = e.target.value
              if (e.keyCode === 13) {
                doSearch(vnode)
              }
            }}),
            m("button.btn btn-primary", {onclick: doSearch.bind(null, vnode)}, "Search")
          ),
          vnode.state.searchError
        )
      ),
      (()=>{
        if (!vnode.state.searchBegun) {
          return m(Suggestions)
        } else {
          return [ m(PaginatedGrid, {key: vnode.state.searchString, searchString: vnode.state.searchString}) ]
        }
      })()
      
    )
  }
}

