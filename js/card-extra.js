
/* PairScope: card extras (timeframe switcher, FDV, age, buys/sells bar, rugged tag, quick actions). Add-on only; no existing code changed. */
(function(){
var tb=document.getElementById("body");if(!tb||!window.MutationObserver)return;
var TFS={},busy=false;
/* label, change, volume, buys, sells */
var TF=[["5m","m5","v5","b5","s5"],["1h","h1","v1","b1","s1"],["6h","h6","v6","b6","s6"],["24h","h24","v","b","sl"]];
var key=function(r){return r.c+"|"+r.addr};
var rugged=function(r){return(r.h24<=-80&&r.l<10000)||(r.l>0&&r.l<1000)};
function html(r){
  var tf=TFS[key(r)]||"24h",d=TF.filter(function(x){return x[0]===tf})[0],
  ch=+r[d[1]]||0,vol=+r[d[2]]||0,b=+r[d[3]]||0,s=+r[d[4]]||0,t=b+s,bp=t?Math.round(b/t*100):50,
  up=ch>=0,dead=rugged(r);
  return '<div class="pxh">'+(dead?'<span class="pxr">RUGGED</span>':'')+'<span class="pxk">FDV <b>'+fm(r.f)+'</b></span><span class="pxk">Age <b>'+fage(r.t)+'</b></span><span class="pxk">Txns <b>'+(r.tx||0).toLocaleString()+'</b></span></div>'
  +'<div class="pxt" role="group" aria-label="Timeframe">'+TF.map(function(x){return '<button type="button" data-px="tf" data-v="'+x[0]+'" class="'+(x[0]===tf?'on':'')+'">'+x[0]+'</button>'}).join("")+'<b class="'+(up?'up':'down')+'">'+(up?'+':'')+ch.toFixed(2)+'%</b></div>'
  +'<div class="pxl"><span>Buys '+b.toLocaleString()+'</span><span>Vol '+fm(vol)+' · '+tf+'</span><span>Sells '+s.toLocaleString()+'</span></div>'
  +'<div class="pxb"><i style="width:'+bp+'%"></i></div>'
  +'<div class="pxa"><a data-px="buy" target="_blank" rel="noopener" href="'+esc(r.c==="solana"?"https://jup.ag/swap/SOL-"+encodeURIComponent(r.addr):r.url)+'">Quick buy</a><a data-px="dex" target="_blank" rel="noopener" href="'+esc(r.url)+'">Open in DEX</a><button type="button" data-px="alert">🔔 Alert</button><button type="button" data-px="share">Share</button></div>';
}
function run(){
  if(busy||typeof D==="undefined"||typeof fm!=="function")return;busy=true;
  try{Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){
    if(tr.querySelector(".pxx"))return;
    var r=D[+tr.getAttribute("data-i")];if(!r)return;
    var td=document.createElement("td");td.className="pxx";td.innerHTML=html(r);tr.appendChild(td);
    tr.classList.toggle("pxd",rugged(r));
  })}catch(e){}
  busy=false;
}
/* capture so taps here don't also open the detail sheet */
tb.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("[data-px]");if(!b)return;
  e.stopPropagation();
  var tr=b.closest("tr"),i=+tr.getAttribute("data-i"),r=D[i],a=b.getAttribute("data-px");if(!r)return;
  if(a==="tf"){TFS[key(r)]=b.getAttribute("data-v");tr.querySelector(".pxx").innerHTML=html(r)}
  else if(a==="alert"){if(typeof openD==="function")openD(i)}
  else if(a==="share"){var u=location.origin+location.pathname+"?c="+encodeURIComponent(r.c)+"&a="+encodeURIComponent(r.addr);
    try{if(navigator.share)navigator.share({title:r.s,url:u});else navigator.clipboard.writeText(u)}catch(x){}}
},true);
new MutationObserver(function(){if(!busy)run()}).observe(tb,{childList:true});
run();
})();
