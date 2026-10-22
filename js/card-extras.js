/* PairScope: card extras v2 (social links, timeframe switcher, FDV, age, buys/sells bar, rugged tag, quick actions). Add-on only; no existing code changed. */
(function(){
var tb=document.getElementById("body");if(!tb||!window.MutationObserver)return;
var TFS={},busy=false;
/* label, change, volume, buys, sells */
var TF=[["5m","m5","v5","b5","s5"],["1h","h1","v1","b1","s1"],["6h","h6","v6","b6","s6"],["24h","h24","v","b","sl"]];
var key=function(r){return r.c+"|"+r.addr};
var rugged=function(r){return(r.h24<=-80&&r.l<10000)||(r.l>0&&r.l<1000)};
var SOC={},pend={},Q=[],tmr;
function socHTML(r){var s=SOC[key(r)];if(!s&&s!==undefined)return"";if(s===undefined)return'<span style="color:var(--muted)">Loading links…</span>';
  if(!s.length)return'<span style="color:var(--down);font-weight:600">No socials listed</span>';
  return s.map(function(x){return'<a data-px="soc" target="_blank" rel="noopener" href="'+esc(x[1])+'" style="color:var(--accent);text-decoration:none;font-weight:600;margin-right:12px">'+x[0]+'</a>'}).join("")}
function queue(r){var k=key(r);if(SOC[k]!==undefined||pend[k]||!r.addr)return;pend[k]=1;Q.push(r);clearTimeout(tmr);tmr=setTimeout(flush,400)}
function refreshSoc(){Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){var r=D[+tr.getAttribute("data-i")],el=tr.querySelector(".pxs");if(r&&el)el.innerHTML=socHTML(r)})}
function flush(){
  var by={};Q.splice(0).forEach(function(r){(by[r.c]=by[r.c]||[]).push(r)});
  Object.keys(by).forEach(function(c){
    for(var i=0;i<by[c].length;i+=30)(function(ch){
      fetch("https://api.dexscreener.com/tokens/v1/"+encodeURIComponent(c)+"/"+ch.map(function(r){return encodeURIComponent(r.addr)}).join(","))
      .then(function(x){return x.json()}).then(function(list){
        var m={};(Array.isArray(list)?list:[]).forEach(function(p){var a=((p.baseToken||{}).address||"").toLowerCase(),inf=p.info;if(!a||!inf)return;var o=m[a]=m[a]||[];
          (inf.websites||[]).slice(0,1).forEach(function(w){o.push(["Website",w.url])});
          (inf.socials||[]).forEach(function(z){var n=z.type==="twitter"?"X":z.type==="telegram"?"Telegram":z.type==="discord"?"Discord":null;if(n)o.push([n,z.url])})});
        ch.forEach(function(r){delete pend[key(r)];SOC[key(r)]=(m[r.addr.toLowerCase()]||[]).filter(function(x){return/^https:\/\//.test(x[1]||"")})});refreshSoc()
      }).catch(function(){ch.forEach(function(r){delete pend[key(r)];SOC[key(r)]=null});refreshSoc()})
    })(by[c].slice(i,i+30))})
}
function html(r){
  var tf=TFS[key(r)]||"24h",d=TF.filter(function(x){return x[0]===tf})[0],
  ch=+r[d[1]]||0,vol=+r[d[2]]||0,b=+r[d[3]]||0,s=+r[d[4]]||0,t=b+s,bp=t?Math.round(b/t*100):50,
  up=ch>=0,dead=rugged(r);
  return '<div class="pxh">'+(dead?'<span class="pxr">RUGGED</span>':'')+'<span class="pxk">FDV <b>'+fm(r.f)+'</b></span><span class="pxk">Age <b>'+fage(r.t)+'</b></span><span class="pxk">Txns <b>'+(r.tx||0).toLocaleString()+'</b></span></div>'
  +'<div class="pxt" role="group" aria-label="Timeframe">'+TF.map(function(x){return '<button type="button" data-px="tf" data-v="'+x[0]+'" class="'+(x[0]===tf?'on':'')+'">'+x[0]+'</button>'}).join("")+'<b class="'+(up?'up':'down')+'">'+(up?'+':'')+ch.toFixed(2)+'%</b></div>'
  +'<div class="pxl"><span>Buys '+b.toLocaleString()+'</span><span>Vol '+fm(vol)+' · '+tf+'</span><span>Sells '+s.toLocaleString()+'</span></div>'
  +'<div class="pxb"><i style="width:'+bp+'%"></i></div>'
  +'<div class="pxs" style="margin-top:8px;font-size:12px">'+socHTML(r)+'</div>'
  +'<div class="pxa"><a data-px="buy" target="_blank" rel="noopener" href="'+esc(r.c==="solana"?"https://jup.ag/swap/SOL-"+encodeURIComponent(r.addr):r.url)+'">Quick buy</a><a data-px="dex" target="_blank" rel="noopener" href="'+esc(r.url)+'">Open in DEX</a><button type="button" data-px="alert">🔔 Alert</button><button type="button" data-px="share">Share</button></div>';
}
function run(){
  if(busy||typeof D==="undefined"||typeof fm!=="function")return;busy=true;
  try{Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){
    if(tr.querySelector(".pxx"))return;
    var r=D[+tr.getAttribute("data-i")];if(!r)return;
    var td=document.createElement("td");td.className="pxx";td.innerHTML=html(r);tr.appendChild(td);
    tr.classList.toggle("pxd",rugged(r));queue(r);
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
