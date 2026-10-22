/* PairScope: live pump.fun launches strip on the New Pairs tab (PumpPortal free data websocket). Add-on only. */
(function(){
if(!window.WebSocket||!window.MutationObserver)return;
var tbl=document.querySelector(".tbl"),tabs=document.getElementById("tabs");if(!tbl||!tabs)return;
var E=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var st=document.createElement("style");
st.textContent="#pxlive{display:none;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 10px}#pxlive .plh{display:flex;align-items:center;gap:8px;font-size:13px}#pxlive .plm{margin-left:auto;color:var(--muted);font-size:11px}#pxlive .pld{width:8px;height:8px;border-radius:50%;background:var(--muted)}#pxlive.on .pld{background:var(--up);box-shadow:0 0 8px var(--up)}#pll a{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line);color:var(--text);text-decoration:none;font-size:13px}#pll a:first-child{margin-top:8px}#pll .pn{font-weight:700}#pll .pq{color:var(--muted);font-size:12px}#pll .pr{margin-left:auto;text-align:right;font-size:12px}#pll .pr span{display:block;color:var(--muted);font-size:11px}#pll a.fresh{animation:plf 1.2s ease-out}@keyframes plf{from{background:rgba(46,204,113,.25)}to{background:transparent}}@media(prefers-reduced-motion:reduce){#pll a.fresh{animation:none}}";
document.head.appendChild(st);
var box=document.createElement("div");box.id="pxlive";
box.innerHTML='<div class="plh"><span class="pld"></span><b>Live pump.fun launches</b><span class="plm" id="plst">connecting…</span></div><div id="pll"></div>';
tbl.insertAdjacentElement("beforebegin",box);
var list=document.getElementById("pll"),stat=document.getElementById("plst"),ws=null,items=[],retry=1000,rt,rd=0;
var fails=0,visible=function(){return typeof mode!=="undefined"&&mode==="new"};
function ago(t){var s=Math.max(0,Math.round((Date.now()-t)/1000));return s<60?s+"s ago":Math.round(s/60)+"m ago"}
function draw(fresh){
  list.innerHTML=items.map(function(x,i){
    return'<a class="'+(fresh&&i===0?"fresh":"")+'" target="_blank" rel="noopener" href="https://dexscreener.com/solana/'+x.m+'"><div><span class="pn">'+E(x.n)+'</span> <span class="pq">'+E(x.s)+'</span></div><div class="pr">MC '+x.mc+' SOL<span>'+(x.b>0?"Dev bought "+x.b+" SOL · ":"")+ago(x.t)+'</span></div></a>'}).join("")||'<div class="pq" style="padding-top:8px">Waiting for the next launch…</div>'}
function connect(){
  if(ws&&ws.readyState<=1)return;stat.textContent="connecting…";
  try{ws=new WebSocket("wss://pumpportal.fun/api/data")}catch(e){return}
  ws.onopen=function(){retry=1000;fails=0;box.classList.add("on");stat.textContent="live";ws.send(JSON.stringify({method:"subscribeNewToken"}))};
  ws.onmessage=function(ev){
    var d;try{d=JSON.parse(ev.data)}catch(e){return}
    if(!d||d.txType!=="create"||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(d.mint||""))return;
    items.unshift({m:d.mint,n:String(d.name||"?").slice(0,32),s:String(d.symbol||"").slice(0,12),mc:(+d.marketCapSol||0).toFixed(1),b:+(+d.solAmount||0).toFixed(2),t:Date.now()});
    items=items.slice(0,8);
    if(!rd){rd=setTimeout(function(){rd=0;draw(true)},300)}};
  ws.onclose=function(){box.classList.remove("on");fails++;stat.textContent=fails>=3?"can't connect":"reconnecting…";ws=null;if(visible()){clearTimeout(rt);rt=setTimeout(connect,retry);retry=Math.min(retry*2,30000)}};
  ws.onerror=function(){try{ws.close()}catch(e){}};
}
function drop(){clearTimeout(rt);if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}box.classList.remove("on");stat.textContent="paused"}
function sync(){var m=typeof mode!=="undefined"?mode:"";box.style.display=m==="new"?"block":"none";if(visible())connect();else drop()}
new MutationObserver(sync).observe(tabs,{childList:true});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&visible())connect()});
setInterval(function(){if(visible()&&items.length)draw(false)},5000);
draw(false);sync();
})();
