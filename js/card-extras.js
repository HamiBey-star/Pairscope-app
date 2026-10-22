/* PairScope: card extras v3 (security chips, social links, timeframe switcher, FDV, age, buys/sells bar, rugged tag, quick actions). Add-on only; no existing code changed. */
(function(){
var tb=document.getElementById("body");if(!tb||!window.MutationObserver)return;
var TFS={},busy=false;
/* label, change, volume, buys, sells */
var TF=[["5m","m5","v5","b5","s5"],["1h","h1","v1","b1","s1"],["6h","h6","v6","b6","s6"],["24h","h24","v","b","sl"]];
var key=function(r){return r.c+"|"+r.addr};
var rugged=function(r){return(r.h24<=-80&&r.l<10000)||(r.l>0&&r.l<1000)};
var SOC={},pend={},Q=[],tmr;
var ICO={
X:['<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>','var(--text)'],
Telegram:['<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>','#26A5E4'],
Website:['<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.8 2.9 4.2 6.2 4.2 10S14.800 19.100 12 22c-2.800-2.900-4.200-6.200-4.200-10S9.200 4.900 12 2z"/></svg>','var(--accent)'],
Discord:['<span style="font-size:10px;font-weight:700">DC</span>','#7983f5']};
function socHTML(r){var s=SOC[key(r)];if(!s&&s!==undefined)return"";if(s===undefined)return'<span style="color:var(--muted)">Loading links\u2026</span>';
  if(!s.length)return'<span style="color:var(--down);font-weight:600">No socials listed</span>';
  return'<div style="display:flex;gap:8px;align-items:center">'+s.map(function(x){return'<a data-px="soc" target="_blank" rel="noopener" aria-label="'+x[0]+'" title="'+x[0]+'" href="'+esc(x[1])+'" style="width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--bg);display:grid;place-items:center;text-decoration:none;color:'+(ICO[x[0]]||ICO.Website)[1]+'">'+(ICO[x[0]]||ICO.Website)[0]+'</a>'}).join("")+'</div>'}
function queue(r){var k=key(r);if(SOC[k]!==undefined||pend[k]||!r.addr)return;pend[k]=1;Q.push(r);clearTimeout(tmr);tmr=setTimeout(flush,400)}
function refreshSoc(){Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){var r=D[+tr.getAttribute("data-i")],el=tr.querySelector(".pxs"),g=tr.querySelector(".pxg");if(r&&el)el.innerHTML=socHTML(r);if(r&&g)g.innerHTML=secHTML(r)})}
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
var SEC={},sp={},SQ=[],stm;
var GR="var(--up)",RD="var(--down)",AM="#f5c542",MU="var(--muted)";
function chip(t,c){return'<span style="border:1px solid var(--line);background:var(--bg);color:'+c+';border-radius:99px;padding:3px 9px;font-size:11.5px;font-weight:600">'+t+'</span>'}
function stt(o,legacy){
  if(o&&typeof o==="object"&&o.status!==undefined)return String(o.status)==="1";
  if(legacy!==undefined&&legacy!==null)return legacy!==""&&legacy!=="11111111111111111111111111111111"&&!/^0x0+$/.test(legacy);
  return null}
function flg(v){return v===undefined||v===null||v===""?null:(v==1||v==="1"||v===true)}
function secParse(t,isSol){
  var pc=function(v){v=parseFloat(v);return isFinite(v)?v:null},hs=Array.isArray(t.holders)?t.holders:[],burn=/^0x0+(dead)?$/i,top=null,hc=parseInt(t.holder_count,10);
  if(hs.length){top=0;hs.slice(0,10).forEach(function(h){if(h.is_contract==1||h.is_contract==="1"||burn.test(h.address||""))return;top+=pc(h.percent)||0})}
  return{sol:isSol,hc:isFinite(hc)?hc:null,top:top,
    mint:isSol?stt(t.mintable,t.mint_authority||t.mintAuthority):flg(t.is_mintable),
    frz:isSol?stt(t.freezable,t.freeze_authority||t.freezeAuthority):flg(t.transfer_pausable)}}
function secHTML(r){
  var s=SEC[key(r)];if(s===undefined)return'<span style="color:var(--muted);font-size:12px">Loading security data\u2026</span>';
  if(!s)return'<span style="color:var(--muted);font-size:12px">Security data unavailable for this token</span>';
  var tp=s.top===null?null:Math.round(s.top*100);
  return chip("Holders "+(s.hc===null?"\u2013":s.hc.toLocaleString()),MU)
   +chip("Top 10 "+(tp===null?"\u2013":tp+"%"),tp===null?MU:tp>=50?RD:tp>=30?AM:GR)
   +chip(s.mint===null?"Mint \u2013":s.mint?"Mint active":"Mint revoked",s.mint===null?MU:s.mint?RD:GR)
   +(s.sol?chip(s.frz===null?"Freeze \u2013":s.frz?"Freeze active":"Freeze revoked",s.frz===null?MU:s.frz?RD:GR)
          :chip(s.frz===null?"Pause \u2013":s.frz?"Pausable":"Not pausable",s.frz===null?MU:s.frz?RD:GR))}
function queueSec(r){
  var k=key(r),ok=r.c==="solana"||(typeof GP_CHAIN!=="undefined"&&GP_CHAIN[r.c]);
  if(SEC[k]!==undefined||sp[k]||!r.addr)return;
  if(!ok){SEC[k]=null;return}
  sp[k]=1;SQ.push(r);clearTimeout(stm);stm=setTimeout(flushSec,500)}
function flushSec(){
  var by={};SQ.splice(0).forEach(function(r){(by[r.c]=by[r.c]||[]).push(r)});
  Object.keys(by).forEach(function(c){
    var sol=c==="solana";
    for(var i=0;i<by[c].length;i+=30)(function(ch){
      var a=ch.map(function(r){return encodeURIComponent(sol?r.addr:r.addr.toLowerCase())}).join(","),
      url=sol?"https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses="+a:"https://api.gopluslabs.io/api/v1/token_security/"+GP_CHAIN[c]+"?contract_addresses="+a;
      fetch(url).then(function(x){return x.json()}).then(function(d){
        var res=d&&d.result;if(!res||typeof res!=="object")throw 0;
        ch.forEach(function(r){var t=res[sol?r.addr:r.addr.toLowerCase()]||res[r.addr];delete sp[key(r)];SEC[key(r)]=t?secParse(t,sol):null});refreshSoc()
      }).catch(function(){ch.forEach(function(r){delete sp[key(r)];SEC[key(r)]=null});refreshSoc()})
    })(by[c].slice(i,i+30))})
}
function html(r){
  var tf=TFS[key(r)]||"24h",d=TF.filter(function(x){return x[0]===tf})[0],
  ch=+r[d[1]]||0,vol=+r[d[2]]||0,b=+r[d[3]]||0,s=+r[d[4]]||0,t=b+s,bp=t?Math.round(b/t*100):50,
  up=ch>=0,dead=rugged(r);
  return '<div class="pxh">'+(dead?'<span class="pxr">RUGGED</span>':'')+'<span class="pxk">FDV <b>'+fm(r.f)+'</b></span><span class="pxk">Age <b>'+fage(r.t)+'</b></span><span class="pxk">Txns <b>'+(r.tx||0).toLocaleString()+'</b></span></div>'
  +'<div class="pxg" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+secHTML(r)+'</div>'
  +'<div class="pxt" role="group" aria-label="Timeframe">'+TF.map(function(x){return '<button type="button" data-px="tf" data-v="'+x[0]+'" class="'+(x[0]===tf?'on':'')+'">'+x[0]+'</button>'}).join("")+'<b class="'+(up?'up':'down')+'">'+(up?'+':'')+ch.toFixed(2)+'%</b></div>'
  +'<div class="pxl"><span>Buys '+b.toLocaleString()+'</span><span>Vol '+fm(vol)+' \u00b7 '+tf+'</span><span>Sells '+s.toLocaleString()+'</span></div>'
  +'<div class="pxb"><i style="width:'+bp+'%"></i></div>'
  +'<div class="pxs" style="margin-top:8px;font-size:12px">'+socHTML(r)+'</div>'
  +'<div class="pxa"><a data-px="buy" target="_blank" rel="noopener" href="'+esc(r.c==="solana"?"https://jup.ag/swap/SOL-"+encodeURIComponent(r.addr):r.url)+'">Quick buy</a><a data-px="dex" target="_blank" rel="noopener" href="'+esc(r.url)+'">Open in DEX</a><button type="button" data-px="alert">\ud83d\udd14 Alert</button><button type="button" data-px="share">Share</button></div>';
}
function run(){
  if(busy||typeof D==="undefined"||typeof fm!=="function")return;busy=true;
  try{Array.prototype.forEach.call(tb.querySelectorAll("tr[data-i]"),function(tr){
    if(tr.querySelector(".pxx"))return;
    var r=D[+tr.getAttribute("data-i")];if(!r)return;
    var td=document.createElement("td");td.className="pxx";td.innerHTML=html(r);tr.appendChild(td);
    tr.classList.toggle("pxd",rugged(r));queue(r);queueSec(r);
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
