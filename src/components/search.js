import MakeBlockies from 'ethereum-blockies'
import AppState from '../lib/appstate.js'
import { ethers } from 'ethers'
import * as libwip2p from 'libwip2p'

var doSearch = function(vnode){
  vnode.state.searchError = null

  let searchString = document.getElementById("searchText").value
  if (ethers.isAddress(searchString)) {
    m.route.set("/channel/" + searchString)
  } else {
    vnode.state.searchError = m("div.invalid-feedback", {style:"display:inline-block;"}, "invalid address")
  }
}

var addToSearchIndex = function(address) {
  libwip2p.Loader.fetchOne(address)
  .then(()=>{
    m.redraw()
  })
}

var retryIpfsFetch = function(address) {
  AppState.retryInitialFetch(address)
  .then(()=>{
    m.redraw()
  })
}

export default{
  oninit: (vnode)=>{
    vnode.state.searchError = null
    vnode.state.suggestedAddresses = []
    vnode.state.appStateEventListener = null    

    Object.seal(vnode.state)

    vnode.state.appStateEventListener = AppState.onUpdate(()=>{
      AppState.getSuggestedChannels()
      .then((channels)=>{
        vnode.state.suggestedAddresses = channels
        m.redraw()
      })
    })

    AppState.getSuggestedChannels()
    .then((channels)=>{
      vnode.state.suggestedAddresses = channels
      m.redraw()
    })
  },
  onremove: (vnode)=>{
    AppState.removeOnUpdate(vnode.state.appStateEventListener)
  },
  view: (vnode)=>{
    return m("div.container text-white",
      m("div.row",
        m("div.col-12",
          m("div.input-group",
            m("input.form-control", {type:"text", id:"searchText", placeholder:"address", style:"max-width:400px;"}),
            m("button.btn btn-primary", {onclick: doSearch.bind(null, vnode)}, "Search")
          ),
          vnode.state.searchError
        )
      ),
      m("div.row mt-4",
        m("div.col-12",
          m("p", "Or try these suggestions:"),
          m("div.row",
            vnode.state.suggestedAddresses.map((address)=>{
              let addToIndexBtn = m("button.btn btn-outline-secondary btn-sm", {onclick: addToSearchIndex.bind(null, address)}, m("i.fa fa-search"), " Add to search index")
              if (AppState.hasAddress(address)) {
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
    )
  }
}

