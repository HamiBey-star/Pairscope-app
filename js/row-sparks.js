/* PairScope: sparkline on every list row */
(function(){
var tb=document.getElementById("body");if(!tb||!window.MutationObserver)return;
var busy=false;
function run(){
  if(busy||!window.__spark||typeof D==="undefined")return;busy=true;
  try{
    tb.setAttribute("data-mode",typeof mode!=="undefined"?mode:"");
    Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){
      if(tr.querySelector(".hv-sp"))return;
      var r=D[+tr.getAttribute("data-i")],td=tr.firstElementChild;if(!r||!td)return;
      var h=window.__spark(r);if(h)td.insertAdjacentHTML("beforeend",h);
    });
  }catch(e){}
  busy=false;
}
new MutationObserver(function(){if(!busy)run()}).observe(tb,{childList:true});
run();
})();
