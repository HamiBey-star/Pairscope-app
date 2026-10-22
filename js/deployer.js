/* PairScope Checker: Deployer box (Solana only). Calls the indexer Worker /deployer. Runs after core.js, no existing code changed. */
(function(){
var API="https://pairscope-indexer2.dr-hamzakhan0.workers.dev",out=document.getElementById("ckout");
if(!out||!window.MutationObserver)return;
var last="";
function e(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function short(a){return a?a.slice(0,6)+"…"+a.slice(-4):""}
function ago(ts){if(!ts)return"unknown";var d=Math.max(0,Date.now()/1000-ts),m=d/60,h=m/60,dy=h/24;return dy>=1?Math.floor(dy)+"d ago":h>=1?Math.floor(h)+"h ago":Math.max(1,Math.floor(m))+"m ago"}
function show(box,html){box.innerHTML='<b>👤 Deployer check</b>'+html}
function run(){
  var inp=document.getElementById("cka"),a=inp&&inp.value.trim();
  if(!a||!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(a))return;
  if(!document.getElementById("ckrisk")||document.getElementById("ckdep"))return;
  var risk=document.getElementById("ckrisk"),box=document.createElement("div");
  box.id="ckdep";box.className="rbox";box.setAttribute("data-a",a);
  show(box,'<p class="q">Looking up the deployer…</p>');
  risk.insertAdjacentElement("afterend",box);
  last=a;
  fetch(API+"/deployer?mint="+encodeURIComponent(a)).then(function(r){return r.json()}).then(function(d){
    if(last!==a||!box.isConnected)return;
    if(!d||d.status!=="ok"){show(box,'<p class="q">'+e((d&&d.error)||"Deployer lookup is unavailable for this token right now.")+'</p>');return}
    var o=d.others||[],s=d.summary||{},h='<div class="grid" style="margin-top:8px">'
      +'<div class="st"><span>Deployer</span><b>'+e(short(d.deployer))+'</b></div>'
      +'<div class="st"><span>Created</span><b>'+e(ago(d.createdTs))+'</b></div>'
      +'<div class="st"><span>Other tokens seen</span><b>'+e(s.otherTokensChecked||0)+'</b></div>'
      +'<div class="st"><span>Low/no liquidity</span><b>'+e(s.lowOrNoLiquidity||0)+'</b></div></div>';
    if(d.deployer)h+='<div style="margin-top:8px"><a target="_blank" rel="noopener" href="https://solscan.io/account/'+encodeURIComponent(d.deployer)+'">View wallet on Solscan ↗</a></div>';
    if(!o.length)h+='<p class="q" style="margin-top:8px">No other tokens from this wallet are in the PairScope index yet.</p>';
    h+='<p class="q" style="margin-top:8px">'+e(d.note||"Likely deployer only. This can be wrong when a launchpad or relayer pays fees. Not an accusation.")+'</p>';
    show(box,h);
  }).catch(function(){if(last===a&&box.isConnected)show(box,'<p class="q">Deployer lookup failed. Try again in a moment.</p>')});
}
new MutationObserver(function(){run()}).observe(out,{childList:true});
})();
