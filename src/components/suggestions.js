import MakeBlockies from 'ethereum-blockies'
import AppState from '../lib/appstate.js'
import * as libwip2p from 'libwip2p'

var addToSearchIndex = function(address) {
  libwip2p.Loader.fetchOne(address)
  .then(()=>{
    m.redraw()
  })
}

export default {
  oninit: (vnode)=>{
    vnode.state.suggestedAddresses = []

    AppState.getSuggestedChannels()
    .then((channels)=>{
      vnode.state.suggestedAddresses = channels
      m.redraw()
    })
  },
  view: (vnode)=>{
    return m("div.row mt-4",
      m("div.col-12",
        m("p", "Or try these suggestions:"),
        m("div.row",
          vnode.state.suggestedAddresses.map((address)=>{
            let addToIndexBtn = m("button.btn btn-outline-secondary btn-sm", {onclick: addToSearchIndex.bind(null, address)}, m("i.fa fa-search"), " Add to search index")
            let addressStats = AppState.getAddressStatsForAddress(address)
            if (addressStats != null && addressStats.loadStatus != null ) {
              addToIndexBtn = null
            }
            if (AppState.getAddressStatus(address) == 'failed') {
              addToIndexBtn = m("div", m("button.btn btn-outline-danger btn-sm", {onclick: retryIpfsFetch.bind(null, address)}, m("i.fa fa-refresh"), " Failed, Click to retry"))
            }
            return m("div.col-3 col-sm-2",
              m("div.mb-2",
                m("div", {style:"text-align:center;"}, m("img", {src: MakeBlockies(address), style:"height:48px;width:48px;border-radius:50%;"})),
                m("div.text-white", {style:"font-size:12px;overflow: hidden;white-space: nowrap;text-overflow:ellipsis;"}, address),
                m("div",
                  m("button.btn btn-outline-secondary btn-sm mb-2", {onclick:()=>m.route.set("/channel/" + address)}, m("i.fa fa-user"), " View channel"),
                  addToIndexBtn
                )
              )
            )
          })
        )
      )
    )
  }
}