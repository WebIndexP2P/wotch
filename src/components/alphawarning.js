var onDismiss = function(vnode){
  localStorage.setItem('warning-dismiss', true)
  var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
  myModal.hide();
}

export default {
  view: function(vnode) {
    return [
      m("div.modal-header",
        m("h5.modal-title","Software warning"),
        m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
      ),
      m("div.modal-body",
        m("p", m("i.fa fa-exclamation-triangle", {style:"color:#ffc107;font-size:20px;"}), " Warning, this software is considered an alpha release. There are many bugs, and no third party audit has been done on the cryptography / encryption."),
        m("p", "If you find something is not working correctly or an action didn't seem to have any effect, try hitting refresh on the browser, doing this resets the internal state of the app and quite often will fix the problem.")
      ),
      m("div.modal-footer",
        m("button.btn btn-primary", {type:"button", onclick: onDismiss}, "Dismiss")
      )
    ]
  }
}