/* PairScope upgrades: headline checker, per-token meta/canonical, accessibility */
(function(){
var g=function(i){return document.getElementById(i)};
function sa(el,o){if(el)for(var k in o)el.setAttribute(k,o[k])}
/* headline checker */
var hca=g("hca");
function heroScan(){var v=hca.value.trim();if(!v){hca.focus();return}
  mode="check";tabs();var s=g("ckc");if(s&&s.querySelector('option[value="auto"]'))s.value="auto";g("cka").value=v;scanToken();
  var c=g("checker");if(c&&c.scrollIntoView)c.scrollIntoView({behavior:"smooth",block:"start"})}
g("hgo").onclick=heroScan;hca.onkeydown=function(e){if(e.key==="Enter")heroScan()};
/* keep the scan in the URL so every scan is shareable */
var _s=scanToken;scanToken=function(){_s();var a=g("cka").value.trim(),c=g("ckc").value;
  if(a)try{history.replaceState(null,"","?scan="+encodeURIComponent(a)+(c&&c!=="auto"?"&c="+encodeURIComponent(c):""))}catch(e){}};
/* tabs: ARIA roles, hide the hero inside the Checker tab */
var _t=tabs;tabs=function(){_t();var h=g("hero");if(h)h.style.display=mode==="check"?"none":"";
  var t=g("tabs");sa(t,{role:"tablist","aria-label":"Views"});
  [].forEach.call(t.children,function(b){sa(b,{role:"tab","aria-selected":b.classList.contains("on")?"true":"false"})})};
tabs();
/* per-token title, description and canonical (crawlers: see og-worker.js) */
var O={d:document.title,od:(document.querySelector('meta[property="og:description"]')||{}).content||"",
  md:(document.querySelector('meta[name="description"]')||{}).content||""};
function cano(u){var l=document.querySelector('link[rel="canonical"]');if(!l){l=document.createElement("link");l.rel="canonical";document.head.appendChild(l)}l.href=u}
function setM(t,d,u){document.title=t;
  [['meta[property="og:title"]',t],['meta[name="twitter:title"]',t],['meta[property="og:description"]',d],['meta[name="description"]',d]].forEach(function(p){var m=document.querySelector(p[0]);if(m)m.setAttribute("content",p[1])});cano(u)}
function resetM(){document.title=O.d;
  [['meta[property="og:title"]',"PairScope"],['meta[name="twitter:title"]',"PairScope"],['meta[property="og:description"]',O.od],['meta[name="description"]',O.md]].forEach(function(p){var m=document.querySelector(p[0]);if(m)m.setAttribute("content",p[1])});cano(location.origin+location.pathname)}
var lastF=null;
var _o=openR;openR=function(r){lastF=document.activeElement;_o(r);
  try{var rk=r.rs!=null?r.rs:riskCalc(r).s;
    setM(r.s+"/"+r.q+" on "+r.c+": price, risk & contract check | PairScope",
      r.s+" "+fprice(r.p)+" ("+(r.h24>=0?"+":"")+r.h24.toFixed(1)+"% 24h) · Liquidity "+fm(r.l)+" · Risk "+rk+"/100. Live data and contract security scan on PairScope.",
      location.origin+location.pathname+"?c="+encodeURIComponent(r.c)+"&a="+encodeURIComponent(r.addr));
    sa(g("cl"),{"aria-label":"Close token details"});sa(g("shr"),{"aria-label":"Share this token"});
    setTimeout(function(){var c=g("cl");if(c)c.focus()},60)}catch(e){}};
document.addEventListener("click",function(e){if(e.target&&e.target.id==="cl"){resetM();if(lastF&&document.contains(lastF)&&lastF.focus)lastF.focus()}});
/* accessibility: focusable rows/headers/stars, keyboard activation, Escape closes details */
function rows(){
  [].forEach.call(document.querySelectorAll("#body tr[data-i]"),function(tr){var s=tr.querySelector(".sym");sa(tr,{tabindex:"0","aria-label":"Open "+(s?s.textContent:"token")+" details"})});
  [].forEach.call(document.querySelectorAll("#body .star"),function(s){var on=s.classList.contains("on");sa(s,{role:"button",tabindex:"0","aria-label":on?"Remove from watchlist":"Add to watchlist","aria-pressed":on?"true":"false"})});
  [].forEach.call(document.querySelectorAll("th[data-k]"),function(th){sa(th,{scope:"col",tabindex:"0","aria-sort":th.className==="on"?(dir>0?"ascending":"descending"):"none"})})}
new MutationObserver(rows).observe(g("body"),{childList:true});rows();
document.addEventListener("keydown",function(e){var t=e.target;
  if(e.key==="Escape"&&g("detail").classList.contains("open")&&!/INPUT|SELECT|TEXTAREA/.test(t.tagName)){var c=g("cl");if(c)c.click();return}
  if(e.key!=="Enter"&&e.key!==" ")return;
  if((t.classList&&t.classList.contains("star"))||(t.tagName==="TR"&&t.hasAttribute("data-i"))||(t.tagName==="TH"&&t.hasAttribute("data-k"))){e.preventDefault();t.click()}});
})();
