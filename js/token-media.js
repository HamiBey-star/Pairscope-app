/* PairScope layer 4: token pictures + launch-platform badges (pump.fun graduates get 🎓). */
(function(){
var bd=$("body");
function hue(s){var h=0;s=String(s||"?");for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h}
function plat(r){var a=r.addr||"",d=String(r.dex||"").toLowerCase(),c=String(r.c||"").toLowerCase();
  if(c.indexOf("robinhood")>-1||d.indexOf("robinhood")>-1)return{n:"Robinhood",g:0};
  if(d==="pumpfun")return{n:"pump.fun (bonding curve)",g:0};
  if(d==="pumpswap")return{n:"pump.fun",g:1};
  if(c==="solana"&&/pump$/.test(a))return{n:"pump.fun",g:1};
  if(d==="moonshot")return{n:"Moonshot",g:0};
  if(c==="solana"&&/bonk$/.test(a))return{n:"bonk.fun",g:0};
  return null}
function logo(r){var u=[],i=0,w=document.createElement("span"),p=plat(r);
  if(/^https:\/\//.test(r.img||""))u.push(r.img);
  if(r.c&&r.addr)u.push("https://dd.dexscreener.com/ds-data/tokens/"+encodeURIComponent(r.c)+"/"+encodeURIComponent(r.addr)+".png");
  w.className="tk";if(p)w.title=(p.g?"Graduated on ":"Launched on ")+p.n;
  function badge(){if(p&&p.g){var g=document.createElement("i");g.textContent="\uD83C\uDF93";w.appendChild(g)}}
  function av(){w.textContent="";var b=document.createElement("b");b.textContent=String(r.s||"?").replace(/^[^A-Za-z0-9]+/,"").charAt(0).toUpperCase()||"?";b.style.background="hsl("+hue(r.s)+",45%,38%)";w.appendChild(b);badge()}
  function next(){if(i>=u.length)return av();var m=new Image();m.alt="";m.width=m.height=26;m.loading="lazy";m.decoding="async";m.referrerPolicy="no-referrer";m.onerror=next;m.src=u[i++];w.textContent="";w.appendChild(m);badge()}
  next();return w}
function deco(){[].forEach.call(bd.querySelectorAll("tr[data-i]"),function(tr){if(tr.querySelector(".tk"))return;var r=D[+tr.getAttribute("data-i")],sy=tr.querySelector(".sym");if(!r||!sy)return;sy.parentNode.insertBefore(logo(r),sy)})}
new MutationObserver(deco).observe(bd,{childList:true});deco();
var _o4=openR;openR=function(r){_o4(r);try{var b=$("pxbar");if(!b)return;var p=plat(r);b.insertBefore(logo(r),b.firstChild);if(p){var s=document.createElement("span");s.className="pl";s.textContent=(p.g?"\uD83C\uDF93 Graduated on ":"Launched on ")+p.n;b.insertBefore(s,b.children[1])}}catch(e){}};
})();
