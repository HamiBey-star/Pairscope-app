function goWallet() {
  var box = document.getElementById("wsearch");
  var v = box ? box.value.trim() : "";
  if (v) window.location.href = "/wallet?address=" + encodeURIComponent(v);
}

document.addEventListener("click", function (e) {
  if (e.target.closest && e.target.closest("#wgo")) {
    e.preventDefault();
    e.stopImmediatePropagation();
    goWallet();
  }
}, true);

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target && e.target.id === "wsearch") {
    e.preventDefault();
    e.stopImmediatePropagation();
    goWallet();
  }
}, true);
