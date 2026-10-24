(function () {
  var b = document.createElement("button");
  b.textContent = "↑";
  b.setAttribute("aria-label", "Back to top");
  b.style.cssText = "position:fixed;right:14px;bottom:90px;z-index:50;width:42px;height:42px;border-radius:50%;border:0;background:#22d3ee;color:#0d192f;font-size:20px;display:none";
  b.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  document.body.appendChild(b);
  window.addEventListener("scroll", function () {
    b.style.display = window.scrollY > 600 ? "block" : "none";
  });
})();
