(function () {
  var b = document.createElement("button");
  b.textContent = "Top";
  b.setAttribute("aria-label", "Back to top");
  b.style.cssText = "position:fixed;right:14px;bottom:90px;z-index:50;width:42px;height:42px;border-radius:50%;border:0;background:#22d3ee;color:#0d192f;font-size:12px;display:none";
  b.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  document.body.appendChild(b);
  window.addEventListener("scroll", function () {
    b.style.display = window.scrollY > 600 ? "block" : "none";
  });
})();
(function () {
  var bar = document.createElement("div");
  bar.textContent = "You're offline. Prices may be out of date.";
  bar.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:100;padding:8px 12px;text-align:center;font-size:13px;background:#f5c542;color:#0d192f;display:none";
  document.body.appendChild(bar);
  function update() { bar.style.display = navigator.onLine ? "none" : "block"; }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
})();
(function () {
  var ev = null;
  var b = document.createElement("button");
  b.textContent = "Install app";
  b.style.cssText = "position:fixed;left:14px;bottom:90px;z-index:50;padding:10px 14px;border-radius:20px;border:0;background:#22d3ee;color:#0d192f;font-size:13px;display:none";
  document.body.appendChild(b);
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    ev = e;
    b.style.display = "block";
  });
  b.onclick = function () {
    if (!ev) return;
    ev.prompt();
    ev.userChoice.finally(function () { ev = null; b.style.display = "none"; });
  };
  window.addEventListener("appinstalled", function () { b.style.display = "none"; });
})();
