/* PairScope: "Hot now" + "Most scanned today" cards */
(function(){
var API="https://pairscope-featured.dr-hamzakhan0.workers.dev";
var bar=document.createElement("div");bar.id="pshot";bar.style.display="none";
var tb=document.getElementById("tabs");if(!tb)return;tb.parentNode.insertBefore(bar,tb);
var tod=null,top=[],E={};
var MIN_SCANS=3,MIN_HEAT=30,RUG=-80; /* Most scanned: needs enough scans and no >80% collapse. Hot now: needs real Heat. */
function shown(){return top.filter(function(o){var r=E[key(o.c,o.a)];return (+o.n||0)>=MIN_SCANS&&!(r&&isFinite(r.h24)&&r.h24<=RUG)})}
var CC={solana:"#9945ff",bsc:"#f3ba2f",ethereum:"#627eea",base:"#0052ff",arbitrum:"#28a0f0",polygon:"#8247e5",optimism:"#ff0420",avalanche:"#e84142"};
function key(c,a){return c+":"+a}
function av(o){var u=o.img&&/^https:\/\/(cdn|dd)\.dexscreener\.com\//.test(o.img)?o.img:"";
  return u?'<img class="hv" src="'+esc(u)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="hv hl">'+esc((o.s||"?").charAt(0).toUpperCase())+'</span>'}
function fp(p){if(!p)return"";if(p>=1)return"$"+p.toFixed(2);if(p>=0.01)return"$"+p.toFixed(4);return"$"+p.toFixed(10).replace(/0+$/,"")}
function pc(v){if(v==null||!isFinite(v))return"";return'<span class="'+(v>=0?"hv-up":"hv-dn")+'">'+(v>=0?"▲ +":"▼ ")+v.toFixed(1)+'%</span>'}
function chain(c){return'<span class="hv-ch" style="border:1px solid '+(CC[c]||"var(--line)")+'55">'+esc(c)+'</span>'}
function spark(r){
  if(!r||!r.p)return"";var P=r.p,ch=[r.h24,r.h6,r.h1,r.m5],v=[];
  for(var i=0;i<4;i++){var d=1+(+ch[i]||0)/100;if(d<=0.01)return"";v.push(P/d)}
  v.push(P);var mn=Math.min.apply(null,v),mx=Math.max.apply(null,v),W=120,H=34,rg=mx-mn||1;
  var pts=v.map(function(y,i){return[(i*W/4).toFixed(1),(H-3-(y-mn)/rg*(H-6)).toFixed(1)]});
  var line=pts.map(function(p,i){return(i?"L":"M")+p[0]+" "+p[1]}).join(" ");
  var up=(+r.h24||0)>=0;
  return'<svg class="hv-sp" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="color:var('+(up?"--up":"--down")+')" aria-hidden="true"><path d="'+line+' L'+W+' '+H+' L0 '+H+' Z" fill="currentColor" opacity=".13"/><path d="'+line+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
window.__spark=spark;
function hotCard(r){
  return'<div class="hv-card hv-hot" data-hc="'+esc(r.c)+'" data-ha="'+esc(r.addr)+'" role="button" tabindex="0">'+av(r)+
  '<div style="min-width:0;flex:1"><div class="hv-sym">'+esc(r.s)+' '+chain(r.c)+'</div>'+
  '<div class="hv-p">'+fp(r.p)+' '+pc(r.h24)+'</div>'+
  '<div class="hv-pills"><span class="hv-pill">'+PSI("bolt",12)+' Heat '+Math.round(r.ht||0)+'</span><span class="hv-pill">'+PSI("shield",12)+' Risk '+r.rs+'</span></div></div>'+spark(r)+'</div>'}
function topCard(o,i){
  var r=E[key(o.c,o.a)]||{},medal=["🥇","🥈","🥉"][i]||"#"+(i+1);
  return'<div class="hv-card" data-hc="'+esc(o.c)+'" data-ha="'+esc(o.a)+'" role="button" tabindex="0" style="animation-delay:'+(i*60)+'ms">'+
  '<span class="hv-rank">'+medal+'</span><span class="hv-n">'+PSI("eye",12)+' '+(+o.n||0)+'</span>'+av({img:r.img,s:o.s})+
  '<div class="hv-sym">'+esc(o.s||r.s||"?")+'</div>'+chain(o.c)+
  '<div class="hv-p">'+(r.p?fp(r.p)+' '+pc(r.h24):'&nbsp;')+'</div>'+spark(r)+'</div>'}
function draw(){
  var h="",st=shown();
  if(tod)h+='<div class="hv-hd"><span class="hv-t">'+PSI("star",16)+' Hot now</span><span class="hv-s">Organic pick, not a paid slot · high Heat, lower Risk · not advice</span></div>'+hotCard(tod);
  if(st.length)h+='<div class="hv-hd"><span class="hv-t">'+PSI("flame",16)+' Most scanned today</span><span class="hv-s">'+PSI("eye",12)+' = scans</span></div><div class="hv-strip">'+st.map(topCard).join("")+'</div>';
  bar.innerHTML=h;bar.style.display=h?"block":"none";
}
function pick(){
  if(tod||typeof D==="undefined"||!D||!D.length)return;
  var best=null;D.forEach(function(r){if(r.rs>=75&&r.l>=50000&&r.ht>=MIN_HEAT&&(!best||r.ht>best.ht))best=r});
  if(best){tod=best;E[key(best.c,best.addr)]=best;draw()}
}
var n=0,iv=setInterval(function(){pick();if(tod||++n>15)clearInterval(iv)},2000);
function enrich(o){
  var k=key(o.c,o.a);if(E[k])return;
  fetch(B+"/tokens/v1/"+encodeURIComponent(o.c)+"/"+encodeURIComponent(o.a)).then(function(r){return r.json()}).then(function(l){
    var rows=dedupe(l.map(map));if(rows.length){E[k]=rows[0];draw()}}).catch(function(){});
}
function loadTop(){fetch(API+"/top").then(function(r){return r.json()}).then(function(l){top=Array.isArray(l)?l:[];draw();top.forEach(enrich)}).catch(function(){})}
loadTop();setInterval(loadTop,120000);
function act(e){
  var b=e.target.closest&&e.target.closest("[data-hc]");if(!b)return;
  var c=b.getAttribute("data-hc"),a=b.getAttribute("data-ha"),r=E[key(c,a)];
  if(r){openR(r);return}
  fetch(B+"/tokens/v1/"+encodeURIComponent(c)+"/"+encodeURIComponent(a)).then(function(x){return x.json()}).then(function(l){var rows=dedupe(l.map(map));if(rows.length)openR(rows[0])}).catch(function(){});
}
bar.addEventListener("click",act);
bar.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();act(e)}});
bar.addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="IMG"&&t.classList.contains("hv")){var sp=document.createElement("span");sp.className="hv hl";sp.textContent="?";t.replaceWith(sp)}},true);
function logScan(r){
  try{var k="ps_sc_"+new Date().toISOString().slice(0,10)+r.c+r.addr;if(localStorage.getItem(k))return;localStorage.setItem(k,"1")}catch(e){}
  fetch(API+"/scan",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({c:r.c,a:r.addr,s:r.s})}).catch(function(){});
}
var _o=openR;openR=function(r){_o(r);try{logScan(r)}catch(e){}};
})();
