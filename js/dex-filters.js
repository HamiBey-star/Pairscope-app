/* PairScope layer: DEX-screener style filter bar (time / network / DEX), market cap, new-pair icon. */
(function(){
var bd=document.getElementById("body"),tbl=document.querySelector(".tbl");if(!bd||!tbl)return;
var mq=window.matchMedia("(max-width:700px)"),TF=[["5M","m5","v5"],["1H","h1","v1"],["6H","h6","v6"],["24H","h24","v"]],ti=3;
var bar=document.createElement("div");bar.id="dxf";
bar.innerHTML='<button type="button" id="dxt" aria-label="Time frame">\uD83D\uDD52 24H</button><select id="dxc" aria-label="Network"></select><select id="dxd" aria-label="DEX"></select>';
tbl.parentNode.insertBefore(bar,tbl);
var T=document.getElementById("dxt"),C=document.getElementById("dxc"),X=document.getElementById("dxd");
function fill(sel,vals,all){var cur=sel.value,k=vals.join("|");if(sel.getAttribute("data-k")===k)return;sel.setAttribute("data-k",k);
  sel.innerHTML="";[[all[0],all[1]]].concat(vals.map(function(v){return[v,v]})).forEach(function(p){var o=document.createElement("option");o.value=p[0];o.textContent=p[1];sel.appendChild(o)});
  sel.value=[].some.call(sel.options,function(o){return o.value===cur})?cur:all[0]}
function uniq(f){var m={};D.forEach(function(r){if(r[f])m[r[f]]=1});return Object.keys(m).sort()}
function deco(){
  var f=TF[ti];fill(C,uniq("c"),["all","All networks"]);fill(X,uniq("dex"),["","All DEXs"]);
  [].forEach.call(bd.querySelectorAll("tr[data-i]"),function(tr){var r=D[+tr.getAttribute("data-i")];if(!r||tr.children.length<10)return;var c=tr.children;
    c[1].setAttribute("data-mc",r.f?fm(r.f):"-");
    if(r.t&&Date.now()-r.t<864e5)c[2].classList.add("new");
    if(mq.matches){var v=+r[f[1]]||0,a=Math.abs(v);c[8].textContent=a>=1e3?(a/1e3).toFixed(a>=1e4?0:1).replace(".0","")+"K%":a>=100?Math.round(a)+"%":a.toFixed(1)+"%";c[8].className=v>=0?"up":"down";if(ti!==3)c[4].textContent=fm(r[f[2]])}})}
new MutationObserver(deco).observe(bd,{childList:true});deco();
T.onclick=function(){ti=(ti+1)%4;T.textContent="\uD83D\uDD52 "+TF[ti][0];render()};
C.onchange=function(){chain=C.value;render()};
X.onchange=function(){window.DEXF=X.value;render()};
})();
