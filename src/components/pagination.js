export default {  

  oninit: (vnode)=>{    
    vnode.state.numPageLinksToShow = 5
    vnode.state.prevLabel = "Previous"
    vnode.state.nextLabel = "Next"
    if (window.innerWidth < 576) {
      vnode.state.numPageLinksToShow = 2
      vnode.state.prevLabel = m("i.fa fa-arrow-left")
      vnode.state.nextLabel = m("i.fa fa-arrow-right")
    }

    Object.seal(vnode.state)
  },
  view: (vnode)=>{
    if (vnode.attrs.pageCount == 0) {
      return null
    }
    return m("nav",
      m("ul.pagination",
        m("li.page-item " + ((vnode.attrs.page==1)?"disabled":""), m("a.page-link", {href:"#", onclick:()=>{
          if (typeof vnode.attrs.onPageNavigate == 'function') {
            vnode.attrs.onPageNavigate(vnode.attrs.page - 1)
          }
          return false
        }}, vnode.state.prevLabel)),
        (function(){
          let pageLinks = [];
          let startPage = vnode.attrs.page - (vnode.state.numPageLinksToShow + 1)
          let endPage = vnode.attrs.page + vnode.state.numPageLinksToShow          
          if (startPage <= 0) {
            startPage = 0
          } else {
            if (window.innerWidth >= 576) {
              pageLinks.push(m("li.page-item", m("a.page-link",{href:"#", onclick:()=>false}, "...")))
            }
          }
          let isEndGap = true
          if (endPage >= vnode.attrs.pageCount) {
            endPage = vnode.attrs.pageCount
            if (vnode.attrs.hasUnscanned) {
              endPage++
            } else {
              isEndGap = false
            }
          }
          
          for (let a = startPage; a < endPage; a++) {
            let active;
            if (a + 1 == vnode.attrs.page) {
              active = "active"
            }
            pageLinks.push(m("li.page-item " + active, m("a.page-link", {href:"#", onclick:(e)=>{
              if (typeof vnode.attrs.onPageNavigate == 'function') {
                vnode.attrs.onPageNavigate(a + 1)
              }
              setTimeout(()=>{
                e.target.blur()
              }, 200)              
              return false
            }}, a + 1)))
          }

          if (isEndGap || vnode.attrs.hasUnscanned) {
            pageLinks.push(m("li.page-item", m("a.page-link",{href:"#", onclick:()=>false}, "...")))
          }

          return pageLinks;
        })(),            
        m("li.page-item " + ((vnode.attrs.page==vnode.attrs.pageCount&&vnode.attrs.hasUnscanned==false)?"disabled":""), m("a.page-link", {href:"#", onclick:()=>{
          if (typeof vnode.attrs.onPageNavigate == 'function') {
            vnode.attrs.onPageNavigate(vnode.attrs.page + 1)
          }
          return false
        }}, vnode.state.nextLabel))
      )
    )
  }
}