/* PairScope UX layer 2: swipe-to-star, pull-to-refresh, trend sparklines, install-to-home-screen. */
(function(){
var hap=function(n){try{navigator.vibrate&&navigator.vibrate(n||8)}catch(e){}};
var pill=document.createElement("div");pill.id="psptr";document.body.appendChild(pill);var pt;
function note(t,keep,ms){pill.textContent=t;pill.classList.add("on");clearTimeout(pt);if(!keep)pt=setTimeout(function(){pill.classList.remove("on")},ms||1600)}
function hide(){clearTimeout(pt);pill.classList.remove("on")}
var dt=$("detail"),bd=$("body");

/* swipe a row left or right to star it */
var sx,sy,sr,dx,mv,sup=0;
bd.addEventListener("touchstart",function(e){var tr=e.target.closest("tr[data-i]");if(!tr||e.touches.length>1)return;sr=tr;sx=e.touches[0].clientX;sy=e.touches[0].clientY;dx=0;mv=false},{passive:true});
bd.addEventListener("touchmove",function(e){if(!sr)return;var x=e.touches[0].clientX-sx,y=e.touches[0].clientY-sy;
  if(!mv){if(Math.abs(y)>10&&Math.abs(y)>Math.abs(x)){sr=null;return}if(Math.abs(x)>12)mv=true;else return}
  dx=x;sr.style.transition="none";sr.style.transform="translateX("+Math.max(-110,Math.min(110,x))+"px)";sr.style.opacity=1-Math.abs(x)/400;
  if(Math.abs(x)>70)note("Release to "+(sr.querySelector(".star.on")?"remove from":"add to")+" watchlist ⭐",1)},{passive:true});
bd.addEventListener("touchend",function(){if(!sr)return;var tr=sr;sr=null;tr.style.transition="";tr.style.transform="";tr.style.opacity="";
  if(mv&&Math.abs(dx)>70){var st=tr.querySelector(".star");if(st){var was=st.classList.contains("on");st.click();note(was?"Removed from watchlist":"⭐ Added to watchlist");hap(14)}}else if(mv)hide();
  if(mv)sup=Date.now()});
bd.addEventListener("click",function(e){if(Date.now()-sup<450){e.stopPropagation();e.preventDefault()}},true);

/* pull down at the top of the page to refresh */
var py=0,pd=0,pa=false;
document.addEventListener("touchstart",function(e){pa=window.scrollY<=0&&e.touches.length===1&&!dt.classList.contains("open")&&!e.target.closest("input,select,#detail,.tabs,.chips,#psnav");py=e.touches[0].clientY;pd=0},{passive:true});
document.addEventListener("touchmove",function(e){if(!pa||sr)return;pd=e.touches[0].clientY-py;if(pd>25)note(pd>85?"Release to refresh":"↓ Pull to refresh",1)},{passive:true});
document.addEventListener("touchend",function(){if(pa&&pd>85){note("Refreshing…");hap(12);try{load(false)}catch(e){}}else if(pa&&pd>25)hide();pa=false;pd=0});

/* Heat sparkline on each card: the Heat score recomputed for the 24h, 6h, 1h and 5m windows (same formula as the Heat column) */
function heatW(r,hw,vol,pch,bu,se,minTx){
  var hrs=r.t?Math.min(24,Math.max(1,(Date.now()-r.t)/36e5)):24,avg=r.v/hrs,
  pace=avg>0?(vol/hw)/avg:0,t=bu+se,bp=t>0?bu/t:0.5,
  h=Math.max(0,Math.min(50,(pace-1)*10))+Math.max(0,Math.min(20,pch))+Math.max(0,Math.min(30,(bp-0.5)*60));
  if(t<minTx)h*=0.5;return Math.round(h)}
function heatSeries(r){
  var hrs=r.t?Math.min(24,Math.max(1,(Date.now()-r.t)/36e5)):24;
  return[heatW(r,hrs,r.v,r.h24,r.b,r.sl,10),heatW(r,Math.min(6,hrs),r.v6||0,r.h6,r.b6||0,r.s6||0,10),heatW(r,1,r.v1,r.h1,r.b1,r.s1,10),heatW(r,1/12,r.v5,r.m5,r.b5||0,r.s5||0,2)]}
function spark(r){
  var v=heatSeries(r),mx=Math.max(40,Math.max.apply(0,v)),W=300,H=34,
  pts=v.map(function(y,i){return(i*W/3).toFixed(1)+","+(H-3-Math.min(1,y/mx)*(H-6)).toFixed(1)}),
  col=hotC(r.ht);if(r.ht<30)col="#6f7d8c";
  return'<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="Heat trend, 24h to 5m: '+v.join(", ")+'"><polygon points="0,'+H+' '+pts.join(" ")+' '+W+','+H+'" fill="'+col+'" fill-opacity=".16"/><polyline points="'+pts.join(" ")+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><div class="spkl"><span>24h</span><span>Heat ⚡ trend</span><span>5m</span></div>'}
function hotC(h){return h>=60?"#ff9f43":h>=30?"#f5c542":"#2b3643"}
function sparks(){Array.prototype.forEach.call(document.querySelectorAll("#body tr[data-i]"),function(tr){
  if(tr.querySelector(".spk"))return;var r=D[+tr.getAttribute("data-i")];if(!r)return;
  var d=document.createElement("div");d.className="spk";d.innerHTML=spark(r);tr.appendChild(d)})}
new MutationObserver(sparks).observe(bd,{childList:true});sparks();

/* install to home screen */
try{
  var ip=null,ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1),stand=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
  var b=document.createElement("button");b.id="psinst";b.type="button";b.className="chip";b.textContent="📲 Install app";
  var bar=document.querySelector(".bar");if(bar)bar.appendChild(b);
  if(!stand&&ios)b.style.display="inline-block";
  window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();ip=e;if(!stand)b.style.display="inline-block"});
  window.addEventListener("appinstalled",function(){b.style.display="none";note("✓ PairScope installed")});
  b.onclick=function(){if(ip){ip.prompt();ip.userChoice.then(function(){ip=null;b.style.display="none"})}else note("Tap the Share button, then “Add to Home Screen”",0,5000)};
  /* single-file PWA: icons + manifest generated at runtime. Old service workers/caches are cleared so every deploy shows fresh. */
  var icoSvg=function(rx){return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1220"/><stop offset="1" stop-color="#14264a"/></linearGradient><linearGradient id="ln" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#00e0b8"/><stop offset="1" stop-color="#4da3ff"/></linearGradient></defs><rect width="512" height="512" rx="'+rx+'" fill="url(#bg)"/><circle cx="256" cy="256" r="150" fill="none" stroke="url(#ln)" stroke-width="22"/><g stroke="#4da3ff" stroke-width="16" stroke-linecap="round"><line x1="256" y1="62" x2="256" y2="108"/><line x1="256" y1="404" x2="256" y2="450"/><line x1="62" y1="256" x2="108" y2="256"/><line x1="404" y1="256" x2="450" y2="256"/></g><polyline points="160,310 212,262 254,292 302,216 352,196" fill="none" stroke="url(#ln)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><circle cx="160" cy="310" r="17" fill="#00e0b8"/><circle cx="352" cy="196" r="17" fill="#4da3ff"/></svg>'};
  var svgUrl=function(rx){return"data:image/svg+xml,"+encodeURIComponent(icoSvg(rx))};
  var png=function(px,rx,cb){try{var im=new Image();im.onload=function(){try{var c=document.createElement("canvas");c.width=c.height=px;c.getContext("2d").drawImage(im,0,0,px,px);cb(c.toDataURL("image/png"))}catch(e){cb(null)}};im.onerror=function(){cb(null)};im.src=svgUrl(rx)}catch(e){cb(null)}};
  var ati=$("ati"),mf=$("mf");
  png(180,0,function(u){if(ati)ati.href=u||svgUrl(0)});
  png(192,112,function(p192){png(512,112,function(p512){
    var icons=p192&&p512?[{src:p192,sizes:"192x192",type:"image/png",purpose:"any"},{src:p512,sizes:"512x512",type:"image/png",purpose:"any"}]:[{src:svgUrl(112),sizes:"any",type:"image/svg+xml",purpose:"any"}];
    var base=location.href.split("#")[0].split("?")[0];
    var man={name:"PairScope",short_name:"PairScope",description:"Live DEX pair scanner with Heat scores, Risk Radar and a contract security checker.",start_url:base,scope:base.replace(/[^\/]*$/,""),display:"standalone",background_color:"#0b0e11",theme_color:"#0b0e11",icons:icons};
    try{if(mf)mf.href=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:"application/manifest+json"}))}catch(e){}
  })});
  try{if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})}).catch(function(){});if(window.caches)caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})}).catch(function(){})}catch(e){}
}catch(e){}
})();
