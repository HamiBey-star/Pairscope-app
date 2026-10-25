if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then(function (reg) {
        reg.update();
      })
      .catch(function () {});
  });
}
