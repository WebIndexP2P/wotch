import { ethers } from 'ethers'
import PaginatedGrid from './paginatedgrid.js'

export default {

  oninit: (vnode)=>{

    vnode.state.targetAddress = m.route.param().address
    if (!ethers.isAddress(vnode.state.targetAddress)) {
      m.route.set("/")
    }

    Object.seal(vnode.state)
  },
  view: function(vnode) {
    return m("div.container text-white",
      m(PaginatedGrid, {key: vnode.state.targetAddress, channelAddress: vnode.state.targetAddress})
    )
  }
}
