/* PairScope UX layer: mobile cards, bottom nav, swipe sheet, heat glow, live flash, verdict rings, haptics. Wraps openR only; no existing code changed. */
(function(){
var hap=function(n){try{navigator.vibrate&&navigator.vibrate(n||8)}catch(e){}};
var hotC=function(h){return h>=60?"#ff9f43":h>=30?"#f5c542":"#2b3643"};
var safeC=function(s){return s>=75?"#2ecc71":s>=50?"#f5c542":"#ff5c5c"};
document.addEventListener("click",function(e){var t=e.target;if(t.closest&&t.closest("button,.star,.tab,.chip,tbody tr"))hap(7)},true);

/* bottom nav */
var N=[["trending","🔥","Trending"],["new","🆕","New"],["featured","🌟","Featured"],["surge","⚡","Surges"],["check","🛡️","Checker"],["watch","⭐","Watchlist"]];
var nav=document.createElement("div");nav.id="psnav";
nav.innerHTML=N.map(function(n){return'<button type="button" data-n="'+n[0]+'"><i>'+n[1]+'</i>'+n[2]+'</button>'}).join("");
document.body.appendChild(nav);
nav.onclick=function(e){var b=e.target.closest("button");if(!b)return;var t=document.querySelector('#tabs [data-m="'+b.getAttribute("data-n")+'"]');if(t)t.click();window.scrollTo({top:0,behavior:"smooth"})};
function navSync(){var on=document.querySelector("#tabs .tab.on"),m=on&&on.getAttribute("data-m");Array.prototype.forEach.call(nav.children,function(b){b.className=b.getAttribute("data-n")===m?"on":""})}
new MutationObserver(navSync).observe($("tabs"),{childList:true});navSync();

/* mobile sort picker (table header is hidden on phones) */
var ss=document.createElement("div");ss.id="pssort";
ss.innerHTML='Sort <select id="pssel"><option value="v">Volume</option><option value="ht">Heat ⚡</option><option value="h24">24h change</option><option value="h1">1h change</option><option value="l">Liquidity</option><option value="age">Newest</option><option value="rs">Safest</option></select>';
document.querySelector(".tbl").insertAdjacentElement("beforebegin",ss);
$("pssel").onchange=function(){var k=this.value,th=document.querySelector('th[data-k="'+k+'"]');if(!th)return;th.click();if(k==="age"&&window.dir===-1)th.click();hap(6)};

/* heat glow + live price flash */
var PM={};
function decorate(){
  Array.prototype.forEach.call(document.querySelectorAll("#body tr[data-i]"),function(tr){
    var r=D[+tr.getAttribute("data-i")];if(!r)return;
    tr.style.setProperty("--hc",hotC(r.ht));
    var k=r.c+"|"+r.addr,td=tr.children[1],o=PM[k];
    if(td&&o!=null&&o!==r.p){var c=r.p>o?"fu":"fd";td.classList.add(c);setTimeout(function(){td.classList.remove(c)},950)}
    PM[k]=r.p});
}
new MutationObserver(decorate).observe($("body"),{childList:true});

/* detail sheet: overlay, swipe-down to close */
var ov=document.createElement("div");ov.id="psov";document.body.appendChild(ov);
ov.onclick=function(){var c=$("cl");if(c)c.click()};
var dt=$("detail");
new MutationObserver(function(){ov.classList.toggle("on",dt.classList.contains("open"))}).observe(dt,{attributes:true,attributeFilter:["class"]});
function swipe(){
  var g=$("grab");if(!g)return;var y0=0,dy=0,on=false;
  g.addEventListener("touchstart",function(e){y0=e.touches[0].clientY;dy=0;on=true;dt.style.transition="none"},{passive:true});
  g.addEventListener("touchmove",function(e){if(!on)return;dy=Math.max(0,e.touches[0].clientY-y0);dt.style.transform="translateY("+dy+"px)"},{passive:true});
  g.addEventListener("touchend",function(){on=false;dt.style.transition="";dt.style.transform="";if(dy>90){hap(10);var c=$("cl");if(c)c.click()}});
}

/* verdict + rings */
function ring(v,l,c,t){v=Math.max(0,Math.min(100,+v||0));var C=2*Math.PI*26;
  return'<div class="pr"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/><circle cx="32" cy="32" r="26" fill="none" stroke="'+c+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+(C*v/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor">'+t+'</text></svg><span>'+l+'</span></div>'}
function verdict(r){
  if(r.rs<50)return"⚠️ Risky setup. Check the contract scan before trading";
  if(r.ht>=60)return"🔥 Hot and passing basic checks. Can still reverse fast";
  if(r.ht>=30)return"📈 Moderate activity, nothing alarming on market checks";
  return"😴 Quiet right now"}
function panel(r){
  var cs;try{var k=csKnown(r);cs=k?k.s:r.cs}catch(e){cs=r.cs}
  var big=dt.querySelector(".big");if(!big)return;
  big.insertAdjacentHTML("afterend",'<div class="vd"><b>PairScope Verdict · '+esc(verdict(r))+'</b><div class="rings">'+ring(r.ht,"Heat",hotC(r.ht),Math.round(r.ht))+ring(r.rs,"Market safety",safeC(r.rs),Math.round(r.rs))+(cs!=null?ring(cs,"Contract",safeC(cs),Math.round(cs)):ring(0,"Contract","#2b3643","–"))+'</div></div>');
}
var _o=openR;
openR=function(r){_o(r);try{dt.insertAdjacentHTML("afterbegin",'<div id="grab"></div>');swipe();panel(r)}catch(e){}};
})();
