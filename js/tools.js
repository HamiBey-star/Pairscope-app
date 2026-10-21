/* PairScope layer 3: filters + presets, watchlist alerts, paper trades, share links/cards, compare, CSV, theme, keyboard. */
(function(){
var LS={g:function(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},s:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var X=function(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var bd=$("body"),dt=$("detail"),tt,F=LS.g("ps_f",{liq:0,age:0,heat:0,safe:0}),PR=LS.g("ps_pr",{}),A=LS.g("ps_al",{on:0,move:15,heat:80}),BS=LS.g("ps_bs",{}),PT=LS.g("ps_pt",[]),CP=[];
function mk(t,id,h){var e=document.createElement(t);e.id=id;if(h)e.innerHTML=h;return e}
function toast(t){var e=$("pxt");e.textContent=t;e.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){e.classList.remove("on")},3200)}
function modal(h){$("pxm").firstChild.innerHTML='<div style="text-align:right"><button class="chip" data-x="mc">✕ Close</button></div>'+h;$("pxm").classList.add("on")}
function closeM(){$("pxm").classList.remove("on")}
var sg=function(n){return(n>0?"+":"")+(+n||0).toFixed(1)+"%"},cl=function(n){return n>=0?"up":"dn"};

/* toolbar + panels */
var tb=mk("div","px3",'<button class="chip" data-x="fp">🎚 Filters</button><button class="chip" data-x="pt">💼 Paper</button><button class="chip" data-x="cp">⚖ Compare (<span id="pxc">0</span>)</button><button class="chip" data-x="csv">⬇ CSV</button><button class="chip" data-x="th" aria-label="Toggle theme">🌓</button>');
var pn=mk("div","pxp",'<label>Min liq $<input type="number" id="fl" min="0"></label><label>Max age h<input type="number" id="fa" min="0"></label><label>Min Heat<input type="number" id="fh" min="0" max="100"></label><label><input type="checkbox" id="fs">Passes risk check</label><select id="fpre" aria-label="Presets"></select><button data-x="ps">Save preset</button><button data-x="pd">Delete</button><button data-x="fr">Reset</button><span class="q" id="pxh"></span><div style="flex-basis:100%;height:0"></div><label><input type="checkbox" id="ao">🔔 Watchlist alerts</label><label>move ≥<input type="number" id="am" min="1"> %</label><label>Heat ≥<input type="number" id="ah" min="1" max="100"></label><span class="q">Works while this page is open. Telegram covers closed-page alerts.</span>');
var ch=$("chips");ch.insertAdjacentElement("afterend",pn);ch.insertAdjacentElement("afterend",tb);
document.body.appendChild(mk("div","pxt"));document.body.appendChild(mk("div","pxm","<div></div>"));
function syncUI(){$("fl").value=F.liq||"";$("fa").value=F.age||"";$("fh").value=F.heat||"";$("fs").checked=!!F.safe;$("ao").checked=!!A.on;$("am").value=A.move;$("ah").value=A.heat;
  $("fpre").innerHTML='<option value="">Presets…</option>'+Object.keys(PR).map(function(n){return'<option>'+X(n)+'</option>'}).join("")}
function readUI(){F={liq:+$("fl").value||0,age:+$("fa").value||0,heat:+$("fh").value||0,safe:$("fs").checked?1:0};A.move=+$("am").value||15;A.heat=+$("ah").value||80;LS.s("ps_f",F);LS.s("ps_al",A);applyF()}
pn.addEventListener("input",function(e){if(e.target.id!=="fpre")readUI()});
$("ao").onchange=function(){A.on=this.checked?1:0;LS.s("ps_al",A);if(A.on){if(window.Notification&&Notification.permission==="default")Notification.requestPermission();toast("🔔 Alerts on for starred pairs")}};
$("fpre").onchange=function(){if(PR[this.value]){F=Object.assign({},PR[this.value]);LS.s("ps_f",F);syncUI();applyF()}};
function pass(r){return(!F.liq||r.l>=F.liq)&&(!F.age||!r.t||(Date.now()-r.t)/36e5<=F.age)&&(!F.heat||r.ht>=F.heat)&&(!F.safe||r.rs>=75)}
function rowsOn(){return[].filter.call(bd.querySelectorAll("tr[data-i]"),function(t){return t.style.display!=="none"})}
function applyF(){var h=0;[].forEach.call(bd.querySelectorAll("tr[data-i]"),function(tr){var r=D[+tr.getAttribute("data-i")],ok=!r||pass(r);tr.style.display=ok?"":"none";if(!ok)h++;var s=tr.querySelector(".star");if(s&&!s.getAttribute("role")){s.setAttribute("role","button");s.setAttribute("aria-label","Toggle watchlist")}});$("pxh").textContent=h?h+" hidden by filters":""}

/* watchlist alerts */
function fire(m){toast("🔔 "+m);try{navigator.vibrate&&navigator.vibrate([60,40,60]);if(window.Notification&&Notification.permission==="granted")new Notification("PairScope",{body:m})}catch(e){}}
function alerts(){if(!A.on)return;D.forEach(function(r){var k=key(r);if(W.indexOf(k)<0||!r.p)return;var b=BS[k];if(!b){BS[k]={p:r.p,h:r.ht,t:Date.now()};return}
  var m=(r.p/b.p-1)*100,msg=Math.abs(m)>=A.move?r.s+" "+sg(m)+" since last check":(r.ht>=A.heat&&b.h<A.heat?r.s+" Heat reached "+r.ht:"");
  if(msg){fire(msg);BS[k]={p:r.p,h:r.ht,t:Date.now()}}else if(Date.now()-b.t>18e5)BS[k]={p:r.p,h:r.ht,t:Date.now()}});LS.s("ps_bs",BS)}

/* paper trades */
function prices(list){var by={};list.forEach(function(p){(by[p.c]=by[p.c]||[]).push(p.a)});return Promise.all(Object.keys(by).map(function(c){return fetch(B+"/tokens/v1/"+c+"/"+by[c].slice(0,30).join(",")).then(function(r){return r.json()}).catch(function(){return[]})})).then(function(a){var m={};dedupe([].concat.apply([],a).map(map)).forEach(function(r){m[key(r)]=r});return m})}
function paperAdd(r){var a=parseFloat(prompt("Paper buy "+r.s+" at "+fprice(r.p)+"\nAmount in USD:","100"));if(!(a>0))return;PT.push({k:key(r),s:r.s,c:r.c,a:r.addr,e:r.p,u:a,t:Date.now()});LS.s("ps_pt",PT);toast("💼 Paper position opened")}
function paperShow(){if(!PT.length){modal('<h3>💼 Paper trades</h3><p class="q">No positions yet. Open any pair and tap “Paper buy”. No wallet or real funds involved.</p>');return}
  modal('<h3>💼 Paper trades</h3><p class="q">Loading prices…</p>');prices(PT).then(function(m){var tot=0,inv=0,h="";PT.forEach(function(p,i){var r=m[p.k],n=r?r.p:p.e,pl=(n/p.e-1)*100,d=p.u*pl/100;tot+=d;inv+=p.u;h+='<tr><td>'+X(p.s)+'</td><td>$'+p.u+'</td><td>'+fprice(p.e)+'</td><td>'+fprice(n)+'</td><td class="'+cl(pl)+'">'+sg(pl)+'</td><td class="'+cl(d)+'">'+(d>=0?"+":"-")+'$'+Math.abs(d).toFixed(2)+'</td><td><button class="chip" data-x="pdel" data-i="'+i+'" aria-label="Close position">✕</button></td></tr>'});
    modal('<h3>💼 Paper trades</h3><div style="overflow-x:auto"><table><thead><tr><th>Token</th><th>Size</th><th>Entry</th><th>Now</th><th>P/L</th><th>P/L $</th><th></th></tr></thead><tbody>'+h+'</tbody></table></div><p>Total: <b class="'+cl(tot)+'">'+(tot>=0?"+":"-")+'$'+Math.abs(tot).toFixed(2)+'</b> on $'+inv.toFixed(0)+'</p><p class="q">Simulated only. Not financial advice.</p>')})}

/* compare */
function cmpShow(){if(CP.length<2){modal('<h3>⚖ Compare</h3><p class="q">Open a pair and tap “Compare” on 2 or 3 pairs first.</p>');return}
  var rows=[["Price",function(r){return fprice(r.p)}],["Age",function(r){return fage(r.t)}],["Liquidity",function(r){return fm(r.l)}],["Volume 24h",function(r){return fm(r.v)}],["24h",function(r){return'<span class="'+cl(r.h24)+'">'+sg(r.h24)+'</span>'}],["1h",function(r){return'<span class="'+cl(r.h1)+'">'+sg(r.h1)+'</span>'}],["Txns",function(r){return r.tx.toLocaleString()}],["Heat",function(r){return r.ht}],["Risk score",function(r){return r.rs==null?"-":r.rs}]];
  modal('<h3>⚖ Compare</h3><div style="overflow-x:auto"><table><thead><tr><th></th>'+CP.map(function(r){return'<th>'+X(r.s)+' <span class="q">'+X(r.c)+'</span></th>'}).join("")+'</tr></thead><tbody>'+rows.map(function(x){return'<tr><td class="q">'+x[0]+'</td>'+CP.map(function(r){return'<td>'+x[1](r)+'</td>'}).join("")+'</tr>'}).join("")+'</tbody></table></div><button class="chip" data-x="cclr" style="margin-top:10px">Clear</button>')}

/* share link + image card */
function link(r){return location.origin+"/s?c="+encodeURIComponent(r.c)+"&a="+encodeURIComponent(r.addr)} /* /s = link-preview page (functions/s.js), then opens the pair */
/* coin picture for the share card: via our own /img proxy first (always exportable), then direct if CORS allows */
var CL={};
function cardLogo(r,cb){var k=r.c+":"+r.addr;if(k in CL){cb(CL[k]);return}
  var src=[],u=[],i=0,done=0,tm;
  if(/^https:\/\//.test(r.img||""))src.push(r.img);
  if(r.c&&r.addr)src.push("https://dd.dexscreener.com/ds-data/tokens/"+encodeURIComponent(r.c)+"/"+encodeURIComponent(r.addr)+".png");
  src.forEach(function(s){u.push({s:"/img?u="+encodeURIComponent(s),x:0});u.push({s:s,x:1})});
  function fin(im){if(done)return;done=1;clearTimeout(tm);CL[k]=im;cb(im)}
  tm=setTimeout(function(){fin(null)},3500);
  (function next(){if(done)return;if(i>=u.length)return fin(null);var o=u[i++],m=new Image();if(o.x)m.crossOrigin="anonymous";m.referrerPolicy="no-referrer";m.onload=function(){fin(m)};m.onerror=next;m.src=o.s})()}
function share(r){cardLogo(r,function(im){var c=document.createElement("canvas");c.width=1000;c.height=525;var g=c.getContext("2d"),gr=g.createLinearGradient(0,0,1000,525);gr.addColorStop(0,"#0b1220");gr.addColorStop(1,"#14264a");g.fillStyle=gr;g.fillRect(0,0,1000,525);
  g.fillStyle="#e6e8ea";g.font="700 64px system-ui,sans-serif";g.fillText(r.s,50,120);g.fillStyle="#8b95a1";g.font="28px system-ui,sans-serif";g.fillText(r.c+"  ·  age "+fage(r.t),50,168);
  g.fillStyle="#e6e8ea";g.font="700 54px system-ui,sans-serif";g.fillText(fprice(r.p),50,260);g.fillStyle=r.h24>=0?"#2ecc71":"#ff5c5c";g.font="700 40px system-ui,sans-serif";g.fillText("24h "+sg(r.h24),50,320);
  g.fillStyle="#4da3ff";g.font="700 40px system-ui,sans-serif";g.fillText("Heat "+r.ht+(r.rs!=null?"   Risk "+r.rs:""),50,390);g.fillStyle="#8b95a1";g.font="26px system-ui,sans-serif";g.fillText("Liq "+fm(r.l)+"   Vol "+fm(r.v),50,440);g.fillStyle="#00e0b8";g.font="700 30px system-ui,sans-serif";g.fillText("PairScope",50,490);
  /* coin picture (falls back to a letter avatar like the table rows) */
  var cx=800,cy=235,R=125;g.save();g.beginPath();g.arc(cx,cy,R,0,6.2832);g.closePath();g.clip();
  if(im){var s=Math.min(im.width,im.height)||1;g.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,cx-R,cy-R,2*R,2*R)}
  else{var sy=String(r.s||"?"),h=0,j;for(j=0;j<sy.length;j++)h=(h*31+sy.charCodeAt(j))%360;g.fillStyle="hsl("+h+",45%,38%)";g.fillRect(cx-R,cy-R,2*R,2*R);g.fillStyle="#fff";g.font="700 130px system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText((sy.replace(/^[^A-Za-z0-9]+/,"").charAt(0)||"?").toUpperCase(),cx,cy+6);g.textAlign="left";g.textBaseline="alphabetic"}
  g.restore();g.lineWidth=8;g.strokeStyle="#00e0b8";g.beginPath();g.arc(cx,cy,R+8,0,6.2832);g.stroke();
  g.fillStyle="#8b95a1";g.font="26px system-ui,sans-serif";g.textAlign="right";g.fillText("pairscope.online",950,490);g.textAlign="left";
  var u=link(r);c.toBlob(function(b){try{var f=new File([b],r.s+"-pairscope.png",{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],text:r.s+" on PairScope",url:u}).catch(function(){});return}}catch(e){}
    try{navigator.clipboard.writeText(u).catch(function(){})}catch(e){}var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=r.s+"-pairscope.png";a.click();toast("Link copied, image card saved")})})}

/* detail action bar */
var _o3=openR;openR=function(r){_o3(r);try{var bar=mk("div","pxbar",'<button class="chip" data-x="sh">🔗 Share</button><button class="chip" data-x="pb">💼 Paper buy</button><button class="chip" data-x="cm">⚖ Compare</button>');bar.R=r;try{cardLogo(r,function(){})}catch(e){}var g=$("grab");if(g)g.after(bar);else dt.prepend(bar)}catch(e){}};

/* csv */
function csv(){var rs=rowsOn().map(function(t){return D[+t.getAttribute("data-i")]}).filter(Boolean);if(!rs.length){toast("Nothing to export");return}
  var q=function(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'},h="symbol,chain,token,pair,price,age_h,txns,vol24h,chg5m,chg1h,chg6h,chg24h,liquidity,heat,risk";
  var t=h+"\n"+rs.map(function(r){return[r.s,r.c,r.addr,r.pair,r.p,r.t?((Date.now()-r.t)/36e5).toFixed(1):"",r.tx,r.v,r.m5,r.h1,r.h6,r.h24,r.l,r.ht,r.rs].map(q).join(",")}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/csv"}));a.download="pairscope-"+mode+".csv";a.click();toast("Exported "+rs.length+" rows")}

/* theme */
function theme(t){document.documentElement.setAttribute("data-theme",t);LS.s("ps_th",t);var m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==="light"?"#f4f6f8":"#0b0e11"}
theme(LS.g("ps_th","dark"));

/* clicks */
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-x]");
  if($("pxm").classList.contains("on")&&e.target===$("pxm")){closeM();return}if(!b)return;var x=b.getAttribute("data-x"),r=b.parentNode&&b.parentNode.R;
  if(x==="fp")pn.classList.toggle("on");else if(x==="pt")paperShow();else if(x==="cp")cmpShow();else if(x==="csv")csv();else if(x==="mc")closeM();
  else if(x==="th")theme(document.documentElement.getAttribute("data-theme")==="light"?"dark":"light");
  else if(x==="ps"){var n=prompt("Preset name:");if(n){PR[n]=Object.assign({},F);LS.s("ps_pr",PR);syncUI();$("fpre").value=n}}
  else if(x==="pd"){var s=$("fpre").value;if(s){delete PR[s];LS.s("ps_pr",PR);syncUI()}}
  else if(x==="fr"){F={liq:0,age:0,heat:0,safe:0};LS.s("ps_f",F);syncUI();applyF()}
  else if(x==="pdel"){PT.splice(+b.getAttribute("data-i"),1);LS.s("ps_pt",PT);paperShow()}
  else if(x==="cclr"){CP=[];$("pxc").textContent=0;cmpShow()}
  else if(x==="sh"&&r)share(r);else if(x==="pb"&&r)paperAdd(r);
  else if(x==="cm"&&r){if(CP.some(function(p){return key(p)===key(r)}))CP=CP.filter(function(p){return key(p)!==key(r)});else if(CP.length>=3)return toast("Compare holds up to 3 pairs");else CP.push(Object.assign({},r));$("pxc").textContent=CP.length;toast("Comparing "+CP.length+" pair"+(CP.length>1?"s":""))}});

/* keyboard: / search, j/k move, Enter open, s star, Esc close */
var ki=-1;document.addEventListener("keydown",function(e){if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){if(e.key==="Escape")e.target.blur();return}if(e.ctrlKey||e.metaKey||e.altKey)return;
  var rs=rowsOn();if(e.key==="/"){e.preventDefault();var i=document.querySelector("input");if(i)i.focus()}
  else if(e.key==="j"||e.key==="k"){e.preventDefault();ki=Math.max(0,Math.min(rs.length-1,ki+(e.key==="j"?1:-1)));[].forEach.call(bd.querySelectorAll("tr.kb"),function(t){t.classList.remove("kb")});if(rs[ki]){rs[ki].classList.add("kb");rs[ki].scrollIntoView({block:"nearest"})}}
  else if(e.key==="Enter"&&rs[ki])rs[ki].click();else if(e.key==="s"&&rs[ki]){var st=rs[ki].querySelector(".star");if(st)st.click()}else if(e.key==="Escape")closeM()});

/* after every table render */
new MutationObserver(function(){ki=-1;applyF();alerts()}).observe(bd,{childList:true});syncUI();applyF();

/* deep link: #pair=chain/address */
var m=/^#pair=([^/]+)\/(.+)$/.exec(location.hash);if(m)try{fetch(B+"/tokens/v1/"+decodeURIComponent(m[1])+"/"+decodeURIComponent(m[2])).then(function(r){return r.json()}).then(function(a){var r=dedupe(a.map(map))[0];if(r)openR(r);else toast("Pair not found")}).catch(function(){toast("Could not open shared pair")})}catch(e){}
})();
