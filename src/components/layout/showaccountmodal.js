let showQR = function(vnode, e) {
  e.preventDefault();

let typeNumber = 0;
let errorCorrectionLevel = 'L';
let qr = qrcode(typeNumber, errorCorrectionLevel);
qr.addData(vnode.attrs.account);
qr.make();
vnode.state.qr = m("div", {style:"text-align: center;"}, m.trust(qr.createImgTag(8, 8)))
}

export default {  
  oninit: (vnode)=>{
    vnode.state.qr = m("div", m("a", {onclick: showQR.bind(null, vnode), href:"#"}, m("i.fa fa-qrcode")));

    Object.seal(vnode.state)
  },

  view: (vnode)=>{
    return [
      m("div.modal-header",
        m("h5.modal-title","Show account"),
        m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
      ),
      m("div.modal-body",
        m("p", m("div", {style:"font-weight: bold;"}, "Your account public address is:"),
          m("div", {style:'word-wrap: break-word;font-family:"Courier New", Courier, monospace;'}, vnode.attrs.account),
          vnode.state.qr
        )
      ),
      m("div.modal-footer",
        m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"},"Close")
      )
    ]
  }
}