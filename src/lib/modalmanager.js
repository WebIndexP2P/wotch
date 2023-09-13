var modalQueue = [];
var activeModalIdx = null;
var listenerActive = false;
var onHideCallback = null;

var showModal = function(vnode, opts){

  var queueLength = modalQueue.push({ vnode: vnode, opts: opts });

  if (activeModalIdx == null) {
    activeModalIdx = modalQueue.length - 1;
    _activateModal();
  }

  // return the queue idx
  return queueLength - 1;
}

var _activateModal = function() {

  let opts = modalQueue[activeModalIdx].opts
  if (opts == null) {
    opts = {}
  }
  if (opts.hasOwnProperty("onHide")) {
    onHideCallback = opts.onHide
  }

  var vnode = modalQueue[activeModalIdx].vnode;
  var myModalEl = document.getElementById('modal');
  if (opts.hasOwnProperty('large') && opts.large == true) {
    myModalEl.classList.add("modal-xl")
  }
  var myModal = new bootstrap.Modal(myModalEl);

  if (!listenerActive) {
    myModalEl.addEventListener('hidden.bs.modal', _handleModalHidden)
    listenerActive = true;
  }

  myModal.show();
  m.mount(document.getElementsByClassName('modal-content')[0], vnode);
}

var _handleModalHidden = function(event) {

  modalQueue[activeModalIdx] = null;

  // find next modal in queue
  var bFound = false;
  for (var a = activeModalIdx + 1; a < modalQueue.length; a++) {
    if (modalQueue[a] != null) {
      activeModalIdx = a;
      bFound = true;
      break;
    }
  }
  if (!bFound) {
    activeModalIdx = null;
  } else {
    _activateModal();
  }

  var myModalEl = document.getElementById('modal');
  myModalEl.classList.remove("modal-xl")

  if (typeof onHideCallback == 'function') {
    onHideCallback()
    onHideCallback = null
  }
}

var hideModal = function(modalIdx) {

  if (isNaN(parseInt(modalIdx))) {
    throw 'invalid modalIdx';
  }

  if (modalIdx < 0 || modalIdx > modalQueue.length - 1) {
    throw 'unknown modalIdx';
  }

  if (modalQueue[modalIdx] == null) {
    throw 'already hidden';
  }

  if (modalIdx > activeModalIdx) {
    modalQueue[modalIdx] = null;
  }

  if (modalIdx == activeModalIdx) {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
    myModal.hide();
  }  
}

export default {
  show: showModal,
  hide: hideModal
}