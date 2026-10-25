var B="https://api.dexscreener.com";
var W=[];try{W=JSON.parse(localStorage.getItem("ps_watch")||"[]")}catch(e){}
function saveW(){try{localStorage.setItem("ps_watch",JSON.stringify(W))}catch(e){}}
function key(r){return r.c+"|"+r.addr}
var A=[];try{A=JSON.parse(localStorage.getItem("ps_alerts")||"[]")}catch(e){}
function saveA(){try{localStorage.setItem("ps_alerts",JSON.stringify(A))}catch(e){}syncAlerts()}
var onlyRk=false,D=[],mode="trending",term="",chain="all",minLiq=false,sortK="v",dir=-1,timer,loading=false,reqId=0;
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function safeUrl(u,c,p,a){if(c==="solana"&&/pump$/.test(a||""))return"https://pump.fun/coin/"+a;return/^https:\/\/dexscreener\.com\//.test(u||"")?u:"https://dexscreener.com/"+encodeURIComponent(c||"")+"/"+encodeURIComponent(p||"")}
function fm(n){n=+n||0;if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(2)+"M";if(n>=1e3)return"$"+(n/1e3).toFixed(1)+"K";return"$"+Math.round(n)}
function fprice(n){if(n>=1)return"$"+n.toFixed(n>=100?1:2);if(n>=0.01)return"$"+n.toFixed(4);return"$"+n.toPrecision(3)}
function fage(t){if(!t)return"-";var m=(Date.now()-t)/6e4;if(m<60)return Math.max(1,Math.round(m))+"m";if(m<1440)return Math.round(m/60)+"h";if(m<43200)return Math.round(m/1440)+"d";return Math.round(m/43200)+"mo"}
function pc(v){v=+v||0;return'<td class="'+(v>=0?"up":"down")+'">'+(v>=0?"+":"")+v.toFixed(2)+'%</td>'}
function map(x){var pcg=x.priceChange||{},tx=(x.txns&&x.txns.h24)||{};
  var o={s:x.baseToken.symbol,q:x.quoteToken.symbol,c:x.chainId,dex:x.dexId,p:+x.priceUsd||0,m5:pcg.m5||0,h1:pcg.h1||0,h6:pcg.h6||0,h24:pcg.h24||0,
  v:(x.volume&&x.volume.h24)||0,l:(x.liquidity&&x.liquidity.usd)||0,f:x.fdv||0,t:x.pairCreatedAt||0,age:x.pairCreatedAt?Date.now()-x.pairCreatedAt:1e15,
  tx:(tx.buys||0)+(tx.sells||0),b:tx.buys||0,sl:tx.sells||0,v5:(x.volume&&x.volume.m5)||0,v6:(x.volume&&x.volume.h6)||0,b5:(x.txns&&x.txns.m5&&x.txns.m5.buys)||0,s5:(x.txns&&x.txns.m5&&x.txns.m5.sells)||0,b6:(x.txns&&x.txns.h6&&x.txns.h6.buys)||0,s6:(x.txns&&x.txns.h6&&x.txns.h6.sells)||0,v1:(x.volume&&x.volume.h1)||0,b1:(x.txns&&x.txns.h1&&x.txns.h1.buys)||0,s1:(x.txns&&x.txns.h1&&x.txns.h1.sells)||0,url:safeUrl(x.url,x.chainId,x.pairAddress),addr:x.baseToken.address,pair:x.pairAddress,img:(x.info&&x.info.imageUrl)||""};o.rs=riskCalc(o).s;heatCalc(o);return o}
function hc(s){return s>=60?"rk-h":s>=30?"rk-y":"rk-m"}
function heatCalc(o){
  var hrs=o.t?Math.min(24,Math.max(1,(Date.now()-o.t)/36e5)):24,avg=o.v/hrs;
  o.sg=avg>0?o.v1/avg:0;o.sg5=avg>0?o.v5*12/avg:0;
  var t1=o.b1+o.s1;o.bp=t1>0?o.b1/t1:0.5;
  var a=Math.max(0,Math.min(50,(o.sg-1)*10)),b=Math.max(0,Math.min(20,o.h1)),c=Math.max(0,Math.min(30,(o.bp-0.5)*60)),ht=a+b+c;
  if(t1<10)ht*=0.5;
  o.ht=Math.round(ht);
}
function momHTML(r){
  var bp=Math.round(r.bp*100),v;
  if(r.ht>=60&&r.rs>=50)v="Strong momentum and it passes basic risk checks. It can still reverse quickly.";
  else if(r.ht>=60)v="Hot but risky: strong momentum with weak safety signals. Pumps like this often reverse.";
  else if(r.ht>=30)v="Moderate activity right now.";
  else v="Quiet right now.";
  return'<div class="rbox"><div style="display:flex;justify-content:space-between;align-items:center"><b>⚡ Momentum</b><span class="rk '+hc(r.ht)+'">Heat '+r.ht+'</span></div><ul>'+
  '<li class="good">Volume pace: <b>'+r.sg5.toFixed(1)+'x</b> (5m) · <b>'+r.sg.toFixed(1)+'x</b> (1h) vs the 24h average</li>'+
  '<li class="good">Buy pressure (1h): '+bp+'% buys ('+r.b1+' buys / '+r.s1+' sells)</li></ul>'+
  '<div style="height:6px;border-radius:4px;background:var(--down);margin-top:6px;overflow:hidden"><div style="width:'+bp+'%;height:100%;background:var(--up)"></div></div><small>'+v+'</small></div>';
}
function pulse(){
  if(mode==="surge"&&SS){$("pulse").innerHTML='<div class="pulse"><span>Screened '+SS.n+' pairs</span><span>⚡ '+SS.c+' passed volume and market checks</span><span>🧪 '+SS.sc+' of '+SS.c+' scanned</span><span><b>'+SS.ok+'</b> passed (80+)</span></div>';return}
  if(!D.length){$("pulse").innerHTML="";return}
  var up=D.filter(function(r){return r.h24>0}).length,pct=Math.round(up/D.length*100),
  avg=D.reduce(function(s,r){return s+r.h1},0)/D.length,
  hot=D.filter(function(r){return r.sg>=2&&r.rs>=50}).length,
  mood=pct>=60?["Bullish","up"]:pct>=40?["Neutral",""]:["Bearish","down"];
  $("pulse").innerHTML='<div class="pulse"><span>Pulse (this list): <b class="'+mood[1]+'">'+mood[0]+'</b></span><span>'+pct+'% of pairs up (24h)</span><span>Avg 1h '+(avg>=0?"+":"")+avg.toFixed(1)+'%</span><span>⚡ '+hot+' surging</span></div>';
}
function rl(s){return s>=75?["Lower risk","g"]:s>=50?["Caution","y"]:["High risk","r"]}
function riskCalc(o){
  var s=100,n=[];
  function bad(p,t){s-=p;n.push({b:1,t:t})}
  function ok(t){n.push({b:0,t:t})}
  if(!o.t)bad(8,"Pair age unknown");
  else{var hrs=(Date.now()-o.t)/36e5;
    if(hrs<1)bad(25,"Launched under 1 hour ago");
    else if(hrs<24)bad(15,"Less than 24 hours old");
    else if(hrs<168)bad(6,"Less than a week old");
    else ok("Trading for "+fage(o.t))}
  if(o.l<5000)bad(35,"Very low liquidity ("+fm(o.l)+"): easy to manipulate");
  else if(o.l<20000)bad(25,"Low liquidity ("+fm(o.l)+")");
  else if(o.l<50000)bad(12,"Below-average liquidity ("+fm(o.l)+")");
  else if(o.l<100000)bad(5,"Moderate liquidity ("+fm(o.l)+")");
  else ok("Healthy liquidity ("+fm(o.l)+")");
  if(o.f>0){var lf=o.l/o.f;
    if(lf<0.01)bad(12,"Liquidity is under 1% of valuation: a modest sell could crash the price");
    else if(lf<0.03)bad(6,"Liquidity is thin compared to valuation");
    else ok("Liquidity is reasonable versus valuation")}
  if(o.l>0&&o.v/o.l>20)bad(10,"Volume is "+Math.round(o.v/o.l)+"x liquidity: possible hype or wash trading");
  if(o.sl===0&&o.b>=30)bad(20,"Many buys but zero sells: possible honeypot (can't sell)");
  else if(o.tx>=50&&o.sl>o.b*1.5)bad(10,"Sellers heavily outnumber buyers");
  else if(o.tx>=50)ok("Buys and sells look balanced");
  if(o.tx<50)bad(10,"Very few trades (under 50 in 24h)");
  if(Math.abs(o.h24)>200)bad(12,"Price moved over 200% in 24h");
  else if(Math.abs(o.h1)>50)bad(8,"Price moved over 50% in the last hour");
  return{s:Math.max(0,Math.min(100,s)),n:n};
}
function riskHTML(r){
  var c=riskCalc(r),l=rl(c.s);
  c.n.sort(function(a,b){return b.b-a.b});
  return'<div class="rbox"><div style="display:flex;justify-content:space-between;align-items:center"><b>🛡️ Risk Radar</b><span class="rk rk-'+l[1]+'">'+c.s+' · '+l[0]+'</span></div><ul>'+
  c.n.map(function(x){return'<li class="'+(x.b?"bad":"good")+'">'+(x.b?"⚠️ ":"✓ ")+x.t+'</li>'}).join("")+
  '</ul><small>Estimate from market data only. It cannot read contract code (hidden mint, taxes, ownership), so it can miss scams. Not a guarantee. Always do your own research.</small></div>';
}
function dedupe(list){var best={};list.forEach(function(r){if(!(r.p>0))return;var k=r.c+r.addr;if(!best[k]||r.l>best[k].l)best[k]=r});return Object.keys(best).map(function(k){return best[k]})}
function getTrending(){
  return fetch(B+"/token-boosts/top/v1").then(function(r){return r.json()}).then(function(list){
    var by={};list.slice(0,60).forEach(function(t){(by[t.chainId]=by[t.chainId]||[]).push(t.tokenAddress)});
    return Promise.all(Object.keys(by).map(function(c){return fetch(B+"/tokens/v1/"+c+"/"+by[c].slice(0,30).join(",")).then(function(r){return r.json()}).catch(function(){return[]})}));
  }).then(function(arrs){return dedupe([].concat.apply([],arrs).map(map))});
}
function getNew(){
  return fetch(B+"/token-profiles/latest/v1").then(function(r){return r.json()}).then(function(list){
    var by={};list.slice(0,60).forEach(function(t){(by[t.chainId]=by[t.chainId]||[]).push(t.tokenAddress)});
    return Promise.all(Object.keys(by).map(function(c){return fetch(B+"/tokens/v1/"+c+"/"+by[c].slice(0,30).join(",")).then(function(r){return r.json()}).catch(function(){return[]})}));
  }).then(function(arrs){return dedupe([].concat.apply([],arrs).map(map))});
}
function getSurge(){
  return Promise.all([getTrending(),getNew()]).then(function(a){
    var seen={},all=a[0].concat(a[1]).filter(function(r){var k=key(r);if(seen[k])return false;seen[k]=1;return true});
    var c=all.filter(function(r){return r.sg>=2&&r.rs>=50&&r.h1>0});
    return gpBatch(c).then(function(){var ok=c.filter(function(r){return r.cs>=80});SS={n:all.length,c:c.length,sc:c.filter(function(r){return r.cs!==undefined}).length,ok:ok.length};recordPicks(ok);return ok});
  });
}
function getWatch(){
  var by={};W.forEach(function(k){var p=k.split("|");(by[p[0]]=by[p[0]]||[]).push(p[1])});
  var cs=Object.keys(by);if(!cs.length)return Promise.resolve([]);
  return Promise.all(cs.map(function(c){return fetch(B+"/tokens/v1/"+c+"/"+by[c].slice(0,30).join(",")).then(function(r){return r.json()}).catch(function(){return[]})})).then(function(arrs){return dedupe([].concat.apply([],arrs).map(map))});
}
function getSearch(q){return fetch(B+"/latest/dex/search?q="+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(d){return dedupe((d.pairs||[]).map(map)).slice(0,60)})}
var __touch=0;
["pointerdown","touchstart","wheel","keydown"].forEach(function(e){addEventListener(e,function(){__touch=Date.now()},{passive:true,capture:true})});
document.addEventListener("visibilitychange",function(){if(!document.hidden)load(true)});
function setBody(h){var b=$("body"),f=b.firstElementChild;if(b.__h===h&&f&&f.hasAttribute("data-i"))return;var y=window.scrollY;b.__h=h;b.innerHTML=h;if(window.scrollY!==y)window.scrollTo(0,y)}
function load(silent){
  if(mode==="check"||mode==="picks"||mode==="map")return;if(silent&&loading)return;if(silent&&(document.hidden||Date.now()-__touch<3000||$("detail").classList.contains("open")))return;var id=++reqId;loading=true;
  if(!silent)$("body").innerHTML='<tr><td colspan="13" class="q" style="text-align:center;padding:24px">Loading…</td></tr>';
  (mode==="trending"?getTrending():mode==="new"?getNew():mode==="surge"?getSurge():mode==="featured"?getFeatured():mode==="watch"?getWatch():(mode==="gainers"||mode==="losers")?Promise.all([getTrending(),getNew()]).then(function(a){return dedupe(a[0].concat(a[1]))}):getSearch(term)).then(function(rows){if(id!==reqId)return;if(mode==="gainers")rows=rows.filter(function(r){return r.h24>0}).sort(function(a,b){return b.h24-a.h24}).slice(0,60);if(mode==="losers")rows=rows.filter(function(r){return r.h24<0}).sort(function(a,b){return a.h24-b.h24}).slice(0,60);D=rows;if(!silent)chain="all";chips();render();pulse();$("live").innerHTML='<span class="dot"></span>Live · updated '+new Date().toLocaleTimeString()})
  .catch(function(){if(id!==reqId)return;if(!silent)$("body").innerHTML='<tr><td colspan="13" class="q" style="text-align:center;padding:24px">Could not load data. Check your connection.</td></tr>'})
  .then(function(){if(id===reqId)loading=false});
}
function render(){window.__render=render;D.forEach(function(r){var c=csKnown(r);if(c)r.cs=c.s});
  var rows=D.filter(function(r){return(chain==="all"||r.c===chain)&&(!minLiq||r.l>=10000)&&(!onlyRk||r.rs>=75)});
  rows.sort(function(a,b){var x=a[sortK],y=b[sortK];return(x>y?1:x<y?-1:0)*dir});VIS=rows;setTimeout(scanVisible,0);
  var __h=rows.slice(0,window.LIMIT||40).map(function(r,n){
    return'<tr data-i="'+D.indexOf(r)+'"><td><span class="star'+(W.indexOf(key(r))>-1?' on':'')+'" data-w="'+esc(key(r))+'">'+(W.indexOf(key(r))>-1?'★':'☆')+'</span><span class="sym">'+esc(r.s)+'</span><span class="q"> /'+esc(r.q)+' · '+esc(r.c)+(r.sp?' <span class="rk rk-y" style="min-width:0;font-size:9px;padding:1px 6px">'+(r.fp?'Featured · '+r.fp:'Featured')+'</span>':'')+'</span></td>'+
    '<td>'+fprice(r.p)+'</td><td>'+fage(r.t)+'</td><td>'+r.tx.toLocaleString()+'</td><td>'+fm(r.v)+'</td>'+pc(r.m5)+pc(r.h1)+pc(r.h6)+pc(r.h24)+'<td>'+fm(r.l)+'</td><td><span class="rk '+hc(r.ht)+'">'+r.ht+'</span> <span class="q">'+r.sg.toFixed(1)+'x</span></td><td><span class="rk rk-'+rl(r.rs)[1]+'">'+r.rs+'</span></td>'+caCell(r)+'</tr>'}).join("")||'<tr><td colspan="13" class="q" style="text-align:center;padding:24px">'+(mode==="watch"?"Your watchlist is empty. Tap ☆ on any pair to save it.":mode==="surge"?"No surges passing market and contract checks right now. Check back in a minute.":mode==="featured"?"No featured listings yet. Tap List your token above to be first.":mode==="gainers"?"No positive 24h movers found in this feed.":mode==="losers"?"No negative 24h movers found in this feed.":"No pairs found")+'</td></tr>';setBody(__h);
  Array.prototype.forEach.call(document.querySelectorAll("th"),function(t){t.className=t.getAttribute("data-k")===sortK?"on":""});
}
function tabs(){$("tabs").innerHTML=[["trending",PSI("flame",15)+" Trending"],["gainers",PSI("up",15)+" Top Gainers"],["losers",PSI("down",15)+" Top Losers"],["new",PSI("new",15)+" New Pairs"],["surge",PSI("bolt",15)+" Surges"],["featured",PSI("star",15)+" Featured"],["picks",PSI("picks",15)+" Picks"],["map",PSI("map",15)+" Map"],["check",PSI("shield",15)+" Checker"],["search",PSI("search",15)+" Search"],["watch",PSI("star",15)+" Watchlist ("+W.length+")"]].map(function(t){return'<button class="tab'+(mode===t[0]?" on":"")+'" data-m="'+t[0]+'">'+t[1]+'</button>'}).join("");var ck=mode==="check"||mode==="picks"||mode==="map";$("checker").style.display=mode==="check"?"block":"none";$("pk").style.display=mode==="picks"?"block":"none";$("mp").style.display=mode==="map"?"block":"none";["pulse","chips"].forEach(function(i){$(i).style.display=ck?"none":""});document.querySelector(".tbl").style.display=ck?"none":"";$("feat").style.display=mode==="featured"?"block":"none"}
function chips(){
  var cs=["all"].concat(D.map(function(r){return r.c}).filter(function(c,i,a){return a.indexOf(c)===i}));
  $("chips").innerHTML=cs.map(function(c){return'<button class="chip'+(c===chain?" on":"")+'" data-c="'+esc(c)+'">'+esc(c)+'</button>'}).join("")+'<button class="chip'+(minLiq?" on":"")+'" data-liq="1">Liq ≥ $10K</button><button class="chip'+(onlyRk?" on":"")+'" data-rk="1">🛡️ Lower risk only</button>';
}
var cur=null;
var GN={ethereum:"eth",bsc:"bsc",solana:"solana",base:"base",arbitrum:"arbitrum",polygon:"polygon_pos",avalanche:"avax",optimism:"optimism",pulsechain:"pulsechain",sui:"sui-network",ton:"ton",cronos:"cro",fantom:"ftm",linea:"linea",blast:"blast",zksync:"zksync",scroll:"scroll"};
var TF=[["5m","minute",5],["15m","minute",15],["1h","hour",1],["4h","hour",4],["1d","day",1]];
function candles(l){
  var W=320,H=170,pr=52,n=l.length,cw=(W-pr)/n,hi=-1e99,lo=1e99,vm=0,i,s="";
  for(i=0;i<n;i++){hi=Math.max(hi,l[i][2]);lo=Math.min(lo,l[i][3]);vm=Math.max(vm,l[i][5])}
  function y(p){return 6+(hi-p)/((hi-lo)||1)*(H-48)}
  for(i=0;i<n;i++){var c=l[i],x=i*cw+cw/2,up=c[4]>=c[1],col=up?"var(--up)":"var(--down)",t=y(Math.max(c[1],c[4])),b=y(Math.min(c[1],c[4]));
    s+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="'+y(c[2]).toFixed(1)+'" y2="'+y(c[3]).toFixed(1)+'" stroke="'+col+'" stroke-width="1"/>'+
    '<rect x="'+(x-cw*0.35).toFixed(1)+'" y="'+t.toFixed(1)+'" width="'+(cw*0.7).toFixed(1)+'" height="'+Math.max(1,b-t).toFixed(1)+'" fill="'+col+'"/>'+
    '<rect x="'+(x-cw*0.35).toFixed(1)+'" y="'+(H-(c[5]/(vm||1))*30).toFixed(1)+'" width="'+(cw*0.7).toFixed(1)+'" height="'+((c[5]/(vm||1))*30).toFixed(1)+'" fill="'+col+'" opacity=".35"/>';}
  s+='<text x="'+(W-pr+4)+'" y="12" fill="var(--muted)" font-size="9">'+fprice(hi)+'</text><text x="'+(W-pr+4)+'" y="'+(H-36)+'" fill="var(--muted)" font-size="9">'+fprice(lo)+'</text>';
  return'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">'+s+'</svg>';
}
function drawTF(r,t){
  cur=r;var tf=TF.filter(function(x){return x[0]===t})[0]||TF[1],el=$("ch");
  $("tfs").innerHTML=TF.map(function(x){return'<button class="tf'+(x[0]===tf[0]?" on":"")+'" data-tf="'+x[0]+'">'+x[0]+'</button>'}).join("");
  el.innerHTML='<div class="q" style="padding:60px 0;text-align:center">Loading chart…</div>';
  fetch("https://api.geckoterminal.com/api/v2/networks/"+(GN[r.c]||r.c)+"/pools/"+r.pair+"/ohlcv/"+tf[1]+"?aggregate="+tf[2]+"&limit=80")
  .then(function(x){return x.json()}).then(function(d){
    var l=d.data.attributes.ohlcv_list;if(!l||!l.length)throw 0;if(cur!==r)return;el.innerHTML=candles(l.slice().reverse());
  }).catch(function(){if(cur===r)el.innerHTML='<div class="q" style="padding:60px 0;text-align:center">Chart unavailable for this pair. Use the link below.</div>'});
}
var GP_CHAIN={ethereum:"1",bsc:"56",base:"8453",arbitrum:"42161",polygon:"137",avalanche:"43114",optimism:"10",fantom:"250",cronos:"25",linea:"59144",blast:"81457",zksync:"324",scroll:"534352",mantle:"5000",pulsechain:"369"};
var TS_CHAIN={ethereum:1,bsc:56,base:8453,arbitrum:42161,polygon:137,avalanche:43114,optimism:10,fantom:250,cronos:25,linea:59144,blast:81457,zksync:324,scroll:534352,mantle:5000};
function flag(v){return v===1||v==="1"||v===true||v==="true"}
function present(v){return v!==undefined&&v!==null&&v!==""&&v!=="0x0000000000000000000000000000000000000000"&&v!=="11111111111111111111111111111111"}
function holderChecks(t,bad,note){
  var burn=/^0x0+(dead)?$/i,pct=function(v){v=parseFloat(v);return Number.isFinite(v)?v:null};
  var hs=Array.isArray(t.holders)?t.holders:[];
  if(hs.length){
    var top=0,max=0;
    hs.forEach(function(h){if(flag(h.is_contract)||burn.test(h.address||""))return;var p=pct(h.percent)||0;top+=p;if(p>max)max=p});
    var T=Math.round(top*100),m="Top holders (excluding contracts) own "+T+"% of supply, largest "+(max*100).toFixed(1)+"%";
    if(top>=0.7)bad(25,m);else if(top>=0.5)bad(15,m);else if(top>=0.3)bad(8,m);else note(m);
  }
  var cp=pct(t.creator_percent);
  if(cp!==null&&cp>=0.2)bad(10,"Creator wallet still holds "+Math.round(cp*100)+"% of supply");
  var lp=Array.isArray(t.lp_holders)?t.lp_holders:[];
  if(lp.length){
    var L=0;lp.forEach(function(h){if(flag(h.is_locked)||burn.test(h.address||""))L+=pct(h.percent)||0});
    L=Math.min(1,L);var LT=Math.round(L*100);
    if(L<0.2)bad(20,"Only "+LT+"% of liquidity is locked or burned");
    else if(L<0.5)bad(10,"Only "+LT+"% of liquidity is locked or burned");
    else note(LT+"% of liquidity is locked or burned");
  }
}
function gpScore(token,isSol){
    var score=100,findings=[];
    function bad(points,label){score-=points;findings.push({bad:true,label:label})}
    function note(label){findings.push({bad:false,label:label})}
    if(isSol){
      var mint=token.mint_authority||token.mintAuthority,freeze=token.freeze_authority||token.freezeAuthority;
      if(present(mint))bad(25,"Mint authority appears to remain enabled");else note("No active mint authority reported");
      if(present(freeze))bad(20,"Freeze authority appears to remain enabled");else note("No active freeze authority reported");
      if(flag(token.metadata_mutable)||flag(token.is_mutable)||flag(token.metadataMutable))bad(8,"Token metadata is mutable");
      if(flag(token.transfer_fee_enable)||flag(token.transfer_fee_enabled)||flag(token.transferFeeEnable))bad(12,"Transfer fee feature reported");
      if(flag(token.non_transferable)||flag(token.nonTransferable))bad(25,"Token may be non-transferable");
      if(flag(token.default_account_state)||flag(token.defaultAccountState))bad(15,"Default account state may restrict transfers");
    }else{
      if(flag(token.is_honeypot))bad(55,"Honeypot flag is enabled");
      if(flag(token.cannot_sell_all))bad(40,"Some holders may be unable to sell all tokens");
      if(flag(token.cannot_buy))bad(35,"Buying is flagged as restricted");
      if(flag(token.is_blacklisted))bad(25,"Blacklist capability or status is flagged");
      if(flag(token.hidden_owner))bad(20,"Hidden owner is flagged");
      if(flag(token.can_take_back_ownership))bad(25,"Ownership recovery/takeover capability is flagged");
      if(flag(token.owner_change_balance))bad(30,"Owner may be able to change holder balances");
      if(flag(token.transfer_pausable))bad(15,"Transfers may be pausable");
      if(flag(token.is_mintable))bad(15,"Additional token minting appears possible");
      if(flag(token.is_open_source)===false && (token.is_open_source==="0"||token.is_open_source===0))bad(15,"Contract source is not open source/verified");
      holderChecks(token,bad,note);var bt=parseFloat(token.buy_tax),st=parseFloat(token.sell_tax);
      if(Number.isFinite(bt)&&bt>0){if(bt>=10)bad(18,"High buy tax reported: "+bt+"%");else if(bt>=5)bad(10,"Buy tax reported: "+bt+"%");else note("Buy tax reported: "+bt+"%")}
      if(Number.isFinite(st)&&st>0){if(st>=10)bad(22,"High sell tax reported: "+st+"%");else if(st>=5)bad(12,"Sell tax reported: "+st+"%");else note("Sell tax reported: "+st+"%")}
      if(token.is_proxy!==undefined)note(flag(token.is_proxy)?"Proxy contract detected":"No proxy flag reported");
      if(token.is_open_source!==undefined&&flag(token.is_open_source))note("Contract source reported as open source/verified");
    }
    score=Math.max(0,Math.min(100,score));
  return{score:score,findings:findings};
}
var CS={},SS=null;
function gpBatch(rows){
  var need=rows.filter(function(r){var c=CS[key(r)];if(c&&Date.now()-c.t<6e5){r.cs=c.s;return false}return true}),by={};
  need.forEach(function(r){var id=r.c==="solana"?"solana":GP_CHAIN[r.c];if(id)(by[id]=by[id]||[]).push(r)});
  return Promise.all(Object.keys(by).map(function(id){
    var list=by[id].slice(0,30),isSol=id==="solana",
    addrs=list.map(function(r){return encodeURIComponent(isSol?r.addr:r.addr.toLowerCase())}).join(","),
    url=isSol?"https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses="+addrs:"https://api.gopluslabs.io/api/v1/token_security/"+id+"?contract_addresses="+addrs;
    return fetch(url).then(function(x){return x.json()}).then(function(d){
      var res=d&&d.result;if(!res||typeof res!=="object")return;
      list.forEach(function(r){var t=res[isSol?r.addr:r.addr.toLowerCase()]||res[r.addr];if(t){var g=gpScore(t,isSol);r.cs=g.score;CS[key(r)]={s:g.score,t:Date.now()}}})
    }).catch(function(){})
  }));
}
function automatedRisk(r,bid){
  var box=$(bid||"onchainRisk");if(!box)return;
  var url,chainId=GP_CHAIN[r.c],isSol=r.c==="solana";
  if(isSol)url="https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses="+encodeURIComponent(r.addr);
  else if(chainId)url="https://api.gopluslabs.io/api/v1/token_security/"+chainId+"?contract_addresses="+encodeURIComponent(r.addr.toLowerCase());
  else {box.innerHTML='<b>🧪 Automated contract security</b><p>GoPlus automated checks are not configured for this network yet.</p><small>Market-based Risk Radar is still available, but contract-level risk is unknown.</small>';return;}
  fetch(url).then(function(resp){if(!resp.ok)throw new Error("Security API HTTP "+resp.status);return resp.json()}).then(function(data){
    if(!box.isConnected||(!bid&&cur!==r))return;
    var result=data&&data.result,token=null;
    if(isSol){if(Array.isArray(result))token=result[0];else if(result&&typeof result==="object"){token=result[r.addr]||result[r.addr.toLowerCase()]||result[Object.keys(result)[0]]}}
    else if(result&&typeof result==="object"){token=result[r.addr.toLowerCase()]||result[r.addr]||result[Object.keys(result)[0]]}
    if(!token||data.code&&String(data.code)!=="1")throw new Error("No security record returned");
    var g=gpScore(token,isSol),score=g.score,findings=g.findings;
    var label=score>=80?"Lower detected risk":score>=55?"Moderate detected risk":score>=30?"High detected risk":"Very high detected risk",cls=score>=80?"rk-m":score>=55?"rk-y":"rk-h";
    if(!findings.length)findings.push({bad:false,label:"No supported high-signal risk flags were returned; coverage may be limited"});
    r.cs=score;r.cf=findings;if(bid==="ckrisk")setTimeout(function(){ckVerdict(r)},0);
    box.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b>🧪 GoPlus contract scan</b><span class="rk '+cls+'">'+score+'/100 · '+label+'</span></div><ul>'+findings.map(function(f){return'<li class="'+(f.bad?'bad':'good')+'">'+(f.bad?'⚠️ ':'✓ ')+f.label+'</li>'}).join('')+'</ul><small>Network: '+esc(r.c)+' · Address checked: <code>'+esc(r.addr)+'</code>. This is a heuristic score from available API flags, not an audit or guarantee. Unreported fields are unknown, not safe. Holder and liquidity-lock checks cover EVM chains only, and exchange or locker wallets can skew them. GoPlus data can be incomplete or delayed.</small>';
  }).catch(function(){if(!box.isConnected||(!bid&&cur!==r))return;box.innerHTML='<b>🧪 Automated contract security</b><p>GoPlus could not return a usable result for this token right now.</p><small>Possible causes: unsupported network, token not indexed, API/network failure, or browser cross-origin restrictions. This does not mean the token is safe. Use the external checker links below.</small>';});
}
var UNI={ethereum:"ethereum",base:"base",arbitrum:"arbitrum",optimism:"optimism",polygon:"polygon",bsc:"bnb",avalanche:"avalanche",blast:"blast"};
function tradeLinks(r){
  var a=encodeURIComponent(r.addr),o="",l=function(h,t,k){return'<a class="tl '+k+'" target="_blank" rel="noopener" href="'+h+'">'+t+' ↗</a>'};
  if(r.rs<50)o='<div style="flex-basis:100%;color:#ffb74d;font-size:12px">⚠️ High-risk token. Run the contract scan before you buy.</div>';
  if(r.c==="solana")return o+l("https://jup.ag/swap/SOL-"+a,"Buy on Jupiter","b")+l("https://jup.ag/swap/"+a+"-SOL","Sell on Jupiter","s");
  if(UNI.hasOwnProperty(r.c)){var u="https://app.uniswap.org/swap?chain="+UNI[r.c];return o+l(u+"&outputCurrency="+a,"Buy on Uniswap","b")+l(u+"&inputCurrency="+a,"Sell on Uniswap","s")}
  return o+'<div class="q" style="flex-basis:100%">No swap link for '+esc(r.c)+' yet. Use the chart link to find a DEX.</div>';
}
function openD(i){openR(D[i])}
function openR(r){
  try{history.replaceState(null,"","?c="+encodeURIComponent(r.c)+"&a="+encodeURIComponent(r.addr))}catch(x){}
  $("detail").innerHTML='<div class="hd"><div><b>'+esc(r.s)+'/'+esc(r.q)+'</b><div class="q">'+esc(r.c)+' · '+esc(r.dex)+(r.sp?' · Sponsored':'')+'</div></div><div style="display:flex;gap:6px;align-items:center"><button class="tf" id="shr">🔗 Share</button><button class="x" id="cl">×</button></div></div>'+
  '<div class="big"><span id="lp">'+fprice(r.p)+'</span> <span id="lc" class="'+(r.h24>=0?"up":"down")+'" style="font-size:15px">'+(r.h24>=0?"+":"")+r.h24.toFixed(2)+'%</span></div>'+'<div id="ch" style="margin-top:8px;min-height:170px"></div><div class="tfs" id="tfs"></div>'+
  '<div class="grid"><div class="st"><span>Volume 24h</span><b>'+fm(r.v)+'</b></div><div class="st"><span>Liquidity</span><b>'+fm(r.l)+'</b></div><div class="st"><span>FDV</span><b>'+fm(r.f)+'</b></div><div class="st"><span>Age</span><b>'+fage(r.t)+'</b></div><div class="st"><span>Buys 24h</span><b class="up">'+r.b.toLocaleString()+'</b></div><div class="st"><span>Sells 24h</span><b class="down">'+r.sl.toLocaleString()+'</b></div></div>'+
  momHTML(r)+riskHTML(r)+'<div id="onchainRisk" class="rbox"><b>🧪 Automated contract security</b><p class="q">Checking GoPlus security data for this token…</p><small>Risk scoring uses available third-party security flags. Missing data is not a clean bill of health.</small></div><div class="rbox"><b>🔎 External security checks</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">'+(r.c==="solana"?'<a target="_blank" rel="noopener" href="https://rugcheck.xyz/tokens/'+encodeURIComponent(r.addr)+'">Open RugCheck report ↗</a>':'')+'<a target="_blank" rel="noopener" href="https://console.gopluslabs.io/token-security">Open GoPlus checker ↗</a><a target="_blank" rel="noopener" href="'+(TS_CHAIN[r.c]?"https://tokensniffer.com/token/"+TS_CHAIN[r.c]+"/"+encodeURIComponent(r.addr):"https://tokensniffer.com/")+'">Open TokenSniffer ↗</a><button type="button" class="tf" data-copy-addr="1">Copy token address</button></div><small>GoPlus and TokenSniffer do not provide a verified deep-link format for every chain here, so PairScope opens their checker and lets you copy the exact address to paste. The automated GoPlus result above is queried using the selected token address and network.</small></div><div class="rbox"><b>↗ Trade this token</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">'+tradeLinks(r)+'<a target="_blank" rel="noopener" href="'+esc(r.url)+'">Trade / chart on DexScreener ↗</a></div><small>Confirm the network and token contract before swapping. External links open the swap page in a new tab; in-app trades are signed in your own wallet and PairScope never holds your keys or funds. Uniswap only routes tokens that have Uniswap pools, so some tokens may show no route.</small></div><div class="al"><select id="ad"><option value="above">Above</option><option value="below">Below</option></select><input id="ap" type="number" step="any" value="'+r.p+'"><button id="aset">🔔 Set alert</button></div>'+'<a href="'+esc(r.url)+'" target="_blank" rel="noopener" style="display:block;margin-top:12px;color:var(--accent)">Open full chart on DexScreener ↗</a><div class="note" style="margin-bottom:0">Chart data from GeckoTerminal.</div>';
  $("detail").classList.add("open");drawTF(r,"15m");automatedRisk(r);liveStart(r);
}
$("q").oninput=function(e){clearTimeout(timer);var v=e.target.value.trim();timer=setTimeout(function(){mode=v?"search":"trending";term=v;tabs();load(false)},500)};
$("tabs").onclick=function(e){var m=e.target.getAttribute("data-m");if(!m)return;if(m==="check"){mode="check";tabs();return}if(m==="picks"){mode="picks";tabs();showPicks();return}if(m==="map"){mode="map";tabs();showMap();return}if(m==="trending"||m==="gainers"||m==="losers"||m==="watch"||m==="new"||m==="surge"||m==="featured"){$("q").value="";term=""}else{term=$("q").value.trim()||"pepe";$("q").value=term}mode=m;if(m==="new"){sortK="age";dir=1}else if(m==="surge"){sortK="ht";dir=-1}else if(m==="gainers"){sortK="h24";dir=-1}else if(m==="losers"){sortK="h24";dir=1}else if(sortK==="age"||sortK==="ht"){sortK="v";dir=-1}tabs();load(false)};
$("chips").onclick=function(e){if(e.target.getAttribute("data-liq")){minLiq=!minLiq}else if(e.target.getAttribute("data-rk")){onlyRk=!onlyRk}else{var c=e.target.getAttribute("data-c");if(!c)return;chain=c}chips();render()};
document.querySelector("thead").onclick=function(e){var k=e.target.getAttribute("data-k");if(!k)return;dir=(sortK===k)?-dir:-1;sortK=k;render()};
$("body").onclick=function(e){var ca=e.target.getAttribute("data-ca");if(ca){var el=e.target,old=el.textContent,done=function(){el.textContent="✓ Copied";setTimeout(function(){el.textContent=old},1200)};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ca).then(done,function(){prompt("Copy token address",ca)})}else{prompt("Copy token address",ca)}return}var w=e.target.getAttribute("data-w");if(w){var i=W.indexOf(w);if(i>-1)W.splice(i,1);else W.push(w);saveW();tabs();if(mode==="watch"){D=D.filter(function(r){return W.indexOf(key(r))>-1});chips()}render();return}
var tr=e.target.closest("tr");if(tr&&tr.getAttribute("data-i"))openD(+tr.getAttribute("data-i"))};
$("detail").onclick=function(e){if(e.target.getAttribute("data-copy-addr")&&cur){var addr=cur.addr;function copied(){e.target.textContent="✓ Address copied"}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(addr).then(copied,function(){prompt("Copy token address",addr)})}else{prompt("Copy token address",addr)}return}
if(e.target.id==="shr"&&cur){var u=location.origin+"/s?c="+encodeURIComponent(cur.c)+"&a="+encodeURIComponent(cur.addr),b=e.target;
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){b.textContent="✓ Link copied"},function(){prompt("Copy this link",u)})}
  else if(navigator.share){navigator.share({title:"PairScope: "+cur.s,url:u}).catch(function(){})}
  else{prompt("Copy this link",u)}
  return}
if(e.target.id==="aset"&&cur){var pv=parseFloat($("ap").value);if(!(pv>0))return;A.push({k:key(cur),s:cur.s,d:$("ad").value,p:pv});saveA();renderAlerts();e.target.textContent="✓ Alert set";try{if(window.Notification&&Notification.permission==="default")Notification.requestPermission()}catch(x){}return}
var tf=e.target.getAttribute("data-tf");if(tf&&cur)drawTF(cur,tf);if(e.target.id==="cl"){liveStop();$("detail").classList.remove("open");try{history.replaceState(null,"",location.pathname)}catch(x){}}};
function renderAlerts(){
  $("alerts").innerHTML=tgBox()+(A.length?'<div class="q" style="margin:12px 2px 4px">🔔 Your alerts'+(TGL?" (also sent to Telegram)":" (active while this page is open)")+'</div>'+A.map(function(a,i){return'<div class="ai"><span>'+esc(a.s)+' '+esc(a.d)+' '+fprice(a.p)+'</span><span class="x2" data-ad="'+i+'">✕</span></div>'}).join(""):"");
}
$("alerts").onclick=function(e){var i=e.target.getAttribute("data-ad");if(i===null)return;A.splice(+i,1);saveA();renderAlerts()};
$("toast").onclick=function(){$("toast").style.display="none"};
function fire(a,now){
  var msg="🔔 "+a.s+" is "+a.d+" "+fprice(a.p)+" (now "+fprice(now)+")";
  $("toast").textContent=msg;$("toast").style.display="block";
  try{if(window.Notification&&Notification.permission==="granted")new Notification("PairScope alert",{body:msg})}catch(x){}
}
function checkAlerts(){
  if(!A.length)return;
  var by={};A.forEach(function(a){var p=a.k.split("|");(by[p[0]]=by[p[0]]||[]).push(p[1])});
  Promise.all(Object.keys(by).map(function(c){return fetch(B+"/tokens/v1/"+c+"/"+by[c].slice(0,30).join(",")).then(function(r){return r.json()}).catch(function(){return[]})}))
  .then(function(arrs){
    var rows=dedupe([].concat.apply([],arrs).map(map)),hit=false;
    rows.forEach(function(r){A=A.filter(function(a){
      if(a.k!==key(r))return true;
      var ok=a.d==="above"?r.p>=a.p:r.p<=a.p;
      if(ok){fire(a,r.p);hit=true;return false}return true})});
    if(hit){if(TGL){try{localStorage.setItem("ps_alerts",JSON.stringify(A))}catch(e){}}else saveA();renderAlerts()} /* Telegram linked: keep the Worker's copy so it can send the Telegram message; syncing the deletion here would cancel it */
  });
}
function fromUrl(){
  var p=new URLSearchParams(location.search),c=p.get("c"),a=p.get("a");
  if(!c||!a)return;
  fetch(B+"/tokens/v1/"+encodeURIComponent(c)+"/"+encodeURIComponent(a)).then(function(r){return r.json()}).then(function(l){
    var rows=dedupe(l.map(map));if(rows.length)openR(rows[0]);
  }).catch(function(){});
}
var FEATURED=[],FEAT_API="https://pairscope-featured.dr-hamzakhan0.workers.dev";
function getFeatured(){
  return fetch(FEAT_API+"/featured").then(function(r){return r.json()}).catch(function(){return[]}).then(function(l){FEATURED=Array.isArray(l)?l:[];return getFeatured2()})
}
function getFeatured2(){
  var by={};FEATURED.forEach(function(f){(by[f.c]=by[f.c]||[]).push(f.a)});
  var cs=Object.keys(by);if(!cs.length)return Promise.resolve([]);
  return Promise.all(cs.map(function(c){return fetch(B+"/tokens/v1/"+encodeURIComponent(c)+"/"+by[c].slice(0,30).map(encodeURIComponent).join(",")).then(function(r){return r.json()}).catch(function(){return[]})})).then(function(arrs){var rows=dedupe([].concat.apply([],arrs).map(map));rows.forEach(function(r){r.sp=true;FEATURED.forEach(function(f){if(f.c===r.c&&String(f.a).toLowerCase()===String(r.addr).toLowerCase())r.fp=f.p})});return rows});
}
$("feat").onclick=function(e){var t=e.target;
  if(t.id==="lst"){var b=$("lstbox");b.style.display=b.style.display==="none"?"block":"none";return}
  if(t.id==="lstcopy"){var ad=$("lstaddr").textContent;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ad).then(function(){t.textContent="✓ Copied"},function(){prompt("Copy address",ad)})}else{prompt("Copy address",ad)}}};
var TG_API="https://pairscope-alerts.dr-hamzakhan0.workers.dev",TG_BOT="PairScopeAlertsBot",TGL=false,TGU="";
try{TGU=localStorage.getItem("ps_uid")||"";if(!/^[A-Za-z0-9_-]{16,64}$/.test(TGU)){var ab=new Uint8Array(18);crypto.getRandomValues(ab);TGU=Array.prototype.map.call(ab,function(b){return("0"+b.toString(16)).slice(-2)}).join("");localStorage.setItem("ps_uid",TGU)}}catch(e){TGU=""}
function tgBox(){
  if(!TG_API||!TGU)return"";
  if(TGL)return'<div class="ai"><span>📲 Telegram connected. Alerts reach your phone even when this page is closed.</span><span class="x2" data-tgoff="1" title="Disconnect">✕</span></div>';
  return'<div class="ai"><span>📲 Get alerts on Telegram, even when this page is closed</span><a class="tl b" target="_blank" rel="noopener" data-tgon="1" href="https://t.me/'+TG_BOT+'?start='+TGU+'">Connect ↗</a></div>';
}
function syncAlerts(){
  if(!TG_API||!TGU||!TGL)return;
  fetch(TG_API+"/alerts",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({uid:TGU,alerts:A.map(function(a){return{k:a.k,s:a.s,d:a.d,p:a.p}})})}).catch(function(){});
}
function tgPull(){
  if(!TG_API||!TGU)return;
  fetch(TG_API+"/me?uid="+TGU).then(function(r){return r.json()}).then(function(d){
    TGL=!!d.linked;
    if(TGL&&Array.isArray(d.alerts)){
      var first=false;try{first=!localStorage.getItem("ps_tgsync")}catch(e){}
      if(first){
        var seen={},m=[];A.concat(d.alerts).forEach(function(a){var q=a.k+"|"+a.d+"|"+a.p;if(!seen[q]){seen[q]=1;m.push(a)}});
        A=m.slice(0,20);try{localStorage.setItem("ps_tgsync","1");localStorage.setItem("ps_alerts",JSON.stringify(A))}catch(e){}
        syncAlerts();
      }else{A=d.alerts;try{localStorage.setItem("ps_alerts",JSON.stringify(A))}catch(e){}}
    }
    renderAlerts();
  }).catch(function(){});
}
function tgWatch(){var n=0,iv=setInterval(function(){n++;if(TGL||n>40){clearInterval(iv);return}tgPull()},4000)}
function tgUnlink(){
  fetch(TG_API+"/unlink",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({uid:TGU})}).catch(function(){});
  TGL=false;try{localStorage.removeItem("ps_tgsync")}catch(e){}renderAlerts();
}
$("alerts").addEventListener("click",function(e){var t=e.target;if(t.getAttribute("data-tgoff"))tgUnlink();else if(t.getAttribute("data-tgon"))tgWatch()});
var VIS=[],scanBusy=false;
function csKnown(r){var c=CS[key(r)];return c&&Date.now()-c.t<6e5?c:null}
function csCell(r){
  if(r.cs===undefined)return'<td class="q">'+(r.cp?"…":"–")+'</td>';
  return'<td><span class="rk rk-'+(r.cs>=80?"g":r.cs>=55?"y":"r")+'">'+r.cs+'</span></td>';
}
function caCell(r){var a=r.addr||"";if(!a)return'<td class="q">–</td>';
  return'<td><span class="q" data-ca="'+esc(a)+'" title="'+esc(a)+' (tap to copy)" style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer">'+esc(a.slice(0,6)+"…"+a.slice(-4))+'</span></td>';
}
function scanVisible(){
  if(scanBusy)return;
  var list=VIS.filter(function(r){return r.cs===undefined&&!csKnown(r)&&(r.c==="solana"||GP_CHAIN[r.c])}).slice(0,30);
  if(!list.length)return;
  scanBusy=true;list.forEach(function(r){r.cp=1});
  gpBatch(list).catch(function(){}).then(function(){
    list.forEach(function(r){r.cp=0;if(r.cs===undefined&&!CS[key(r)])CS[key(r)]={s:undefined,t:Date.now()-5.4e5}});
    scanBusy=false;if(mode==="map")showMap();else if(mode!=="check"&&mode!=="picks")render();
  });
}
var PK=[];try{PK=JSON.parse(localStorage.getItem("ps_picks")||"[]")}catch(e){PK=[]}
function savePK(){try{localStorage.setItem("ps_picks",JSON.stringify(PK.slice(-100)))}catch(e){}}
function recordPicks(rows){
  var now=Date.now(),ch=false;
  rows.forEach(function(r){
    var k=key(r);
    if(PK.some(function(x){return x.k===k&&now-x.t<864e5}))return;
    PK.push({k:k,s:r.s,c:r.c,a:r.addr,p:r.p,t:now,cs:r.cs});ch=true;
  });
  if(ch)savePK();
}
function showPicks(){
  var box=$("pkout");
  if(!PK.length){box.innerHTML='<div class="rbox q" style="margin-top:0">No picks saved yet. Open the Surges tab and leave it open. Every token that passes the checks is saved here with its price at that moment.</div>';return}
  box.innerHTML='<div class="rbox q" style="margin-top:0">Loading prices…</div>';
  var by={};PK.forEach(function(x){if(!by[x.c])by[x.c]=[];if(by[x.c].indexOf(x.a)<0)by[x.c].push(x.a)});
  Promise.all(Object.keys(by).map(function(c){
    return fetch(B+"/tokens/v1/"+encodeURIComponent(c)+"/"+by[c].slice(-30).map(encodeURIComponent).join(",")).then(function(r){return r.json()}).catch(function(){return[]})
  })).then(function(arrs){
    if(mode!=="picks")return;
    var now={};dedupe([].concat.apply([],arrs.filter(Array.isArray)).map(map)).forEach(function(r){now[key(r)]=r.p});
    var rows=PK.slice().reverse().map(function(x){var n=now[x.k];return{x:x,n:n,ch:n>0&&x.p>0?(n/x.p-1)*100:null}});
    var ok=rows.filter(function(r){return r.ch!==null}),win=ok.filter(function(r){return r.ch>0}).length,avg=ok.length?ok.reduce(function(a,r){return a+r.ch},0)/ok.length:0;
    box.innerHTML='<div class="rbox" style="margin-top:0"><b>📈 How Surges picks did</b><div class="q" style="margin-top:6px">'+PK.length+' saved · '+ok.length+' priced · <span class="up">'+win+' up</span> · '+(ok.length-win)+' down · average '+(avg>=0?"+":"")+avg.toFixed(1)+'% since pick</div><small>Saved in this browser only, from the times you had the Surges tab open. Prices come from each token\'s largest pool and can move fast. Not financial advice.</small><div style="margin-top:10px"><button type="button" class="tf" id="pkclr">Clear list</button></div></div><div class="ptb" style="margin-top:12px"><table><thead><tr><th>Token</th><th>Picked</th><th>Price then</th><th>Price now</th><th>Change</th><th>Contract</th></tr></thead><tbody>'+rows.map(function(r){var c=r.ch;return'<tr><td><span class="sym">'+esc(r.x.s)+'</span><span class="q"> · '+esc(r.x.c)+'</span></td><td>'+fage(r.x.t)+' ago</td><td>'+fprice(r.x.p)+'</td><td>'+(r.n>0?fprice(r.n):"–")+'</td><td class="'+(c===null?"q":c>=0?"up":"down")+'">'+(c===null?"–":(c>=0?"+":"")+c.toFixed(1)+"%")+'</td>'+csCell({cs:r.x.cs})+'</tr>'}).join("")+'</tbody></table></div>';
  });
}
$("pk").onclick=function(e){if(e.target.id==="pkclr"){PK=[];savePK();showPicks()}};
var VL=["","🟢 Lower detected risk","🟡 Caution","🔴 High risk"],VT=["","No major red flags from the checks PairScope can run. That is not a guarantee.","Some warning signs. Read the flags below before you trade.","Several serious warning signs. Treat this token as dangerous unless you can verify it yourself."];
function verdictOf(r){
  var rs=r.rs,cs=r.cs,flags=[];
  (r.cf||[]).forEach(function(f){if(f.bad)flags.push(f.label)});
  if(rs!==undefined&&rs<50)flags.push("Market Risk Radar score is low ("+rs+"/100)");
  if(r.t&&Date.now()-r.t<864e5)flags.push("Pair is only "+fage(r.t)+" old");
  if(r.l>0&&r.l<1e4)flags.push("Liquidity is thin ("+fm(r.l)+")");
  var lvl=((cs!==undefined&&cs<55)||(rs!==undefined&&rs<40))?3:((cs!==undefined&&cs<80)||(rs!==undefined&&rs<70)||flags.length>=2||cs===undefined)?2:1;
  return{lvl:lvl,flags:flags};
}
function shareUrl(r){return location.origin+"/s?scan="+encodeURIComponent(r.addr)+"&c="+encodeURIComponent(r.c)} /* /s = link-preview page (functions/s.js), then opens the app */
function ckReport(r){
  var v=verdictOf(r);
  return "PairScope report: "+(r.q?r.s+"/"+r.q:r.s)+" ("+r.c+")\nVerdict: "+VL[v.lvl]+"\nContract scan: "+(r.cs!==undefined?r.cs+"/100":"n/a")+(r.rs!==undefined?" · Market risk: "+r.rs+"/100":"")+(r.l?" · Liquidity "+fm(r.l):"")+(r.t?" · Age "+fage(r.t):"")+"\n"+v.flags.slice(0,4).map(function(f){return"- "+f}).join("\n")+"\nCheck it yourself: "+shareUrl(r)+"\nNot financial advice.";
}
function ckVerdict(r){
  var el=$("ckverdict");if(!el||ckRow!==r)return;
  var v=verdictOf(r);
  el.innerHTML='<div class="rbox" style="margin-top:0;margin-bottom:12px"><b>'+VL[v.lvl]+'</b><div style="margin-top:6px">'+VT[v.lvl]+'</div>'+(v.flags.length?'<ul>'+v.flags.slice(0,4).map(function(f){return'<li class="bad">⚠️ '+esc(f)+'</li>'}).join("")+'</ul>':"")+(r.cs===undefined?'<div class="q">Contract scan is still running or not available for this network.</div>':"")+'<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="tf" data-ckrep="1">Copy report</button><button type="button" class="tf" data-cklink="1">Copy share link</button></div></div>';
}
function cp(txt,b){
  var done=function(){var o=b.textContent;b.textContent="✓ Copied";setTimeout(function(){b.textContent=o},1500)};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){prompt("Copy this",txt)})}else{prompt("Copy this",txt)}
}
function scanFromUrl(){
  var p=new URLSearchParams(location.search),a=p.get("scan"),c=p.get("c");
  if(!a)return;
  mode="check";tabs();$("cka").value=a;
  if(c&&/^[a-z0-9-]{2,30}$/.test(c)&&$("ckc").querySelector('option[value="'+c+'"]'))$("ckc").value=c;
  scanToken();
}
function showMap(){
  var box=$("mpout");
  if(!D.length){
    box.innerHTML='<div class="rbox q" style="margin-top:0">Loading tokens…</div>';
    getTrending().then(function(rows){if(mode!=="map")return;D=rows;showMap()}).catch(function(){box.innerHTML='<div class="rbox q" style="margin-top:0">Could not load tokens. Try again.</div>'});
    return;
  }
  var list=D.slice(0,70),W=340,H=320,L=34,T=14,R=8,BM=30,pw=W-L-R,ph=H-T-BM;
  VIS=list;setTimeout(scanVisible,0);
  var dots=list.map(function(r,i){
    var x=L+pw*Math.max(0,Math.min(100,r.rs))/100,y=T+ph*(1-Math.max(0,Math.min(100,r.ht))/100),
    rad=3+Math.min(7,Math.max(0,(Math.log10((r.l||0)+1)-3)*2)),
    col=r.cs===undefined?"#8b98a9":r.cs>=80?"#2ecc71":r.cs>=55?"#f5b942":"#ff5c5c";
    return'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rad.toFixed(1)+'" fill="'+col+'" fill-opacity=".75" stroke="#fff" stroke-opacity=".35" data-mi="'+i+'" style="cursor:pointer"><title>'+esc(r.s)+' · Heat '+r.ht+' · Risk '+r.rs+'</title></circle>';
  }).join("");
  var mx=L+pw/2,my=T+ph/2,tx=function(x,y,t,a){return'<text x="'+x+'" y="'+y+'" text-anchor="'+(a||"middle")+'" font-size="9" style="fill:var(--muted)">'+t+'</text>'};
  box.innerHTML='<div class="rbox" style="margin-top:0"><b>🧭 Safety vs Heat map</b><div class="q" style="margin-top:6px">Each dot is a token from the list you loaded last. Higher means hotter momentum and further right means lower market risk. Dot color is the contract scan: green 80+, yellow 55 to 79, red below 55, grey not scanned. Tap a dot to open it.</div>'
   +'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:560px;display:block;margin:10px auto 0">'
   +'<rect x="'+L+'" y="'+T+'" width="'+pw+'" height="'+ph+'" rx="8" style="fill:var(--panel);stroke:var(--line)"/>'
   +'<rect x="'+mx+'" y="'+T+'" width="'+pw/2+'" height="'+ph/2+'" fill="#2ecc71" fill-opacity=".08"/>'
   +'<line x1="'+mx+'" y1="'+T+'" x2="'+mx+'" y2="'+(T+ph)+'" stroke="#8b98a9" stroke-opacity=".3" stroke-dasharray="3 4"/>'
   +'<line x1="'+L+'" y1="'+my+'" x2="'+(L+pw)+'" y2="'+my+'" stroke="#8b98a9" stroke-opacity=".3" stroke-dasharray="3 4"/>'
   +tx(L+pw*.75,T+14,"Hot and lower risk")+tx(L+pw*.25,T+14,"Hot and risky")+tx(L+pw*.75,T+ph-6,"Quiet and lower risk")+tx(L+pw*.25,T+ph-6,"Quiet and risky")
   +tx(L+pw/2,H-8,"Risk Radar score (higher is safer)")
   +'<text x="10" y="'+(T+ph/2)+'" font-size="9" text-anchor="middle" transform="rotate(-90 10 '+(T+ph/2)+')" style="fill:var(--muted)">Heat</text>'
   +dots+'</svg></div>';
}
$("mp").onclick=function(e){var i=e.target.getAttribute("data-mi");if(i!==null&&D[i])openR(D[i])};
var liveT=null,liveBusy=false;
function liveStop(){clearInterval(liveT);liveT=null}
function liveStart(r){
  liveStop();
  liveT=setInterval(function(){
    if(cur!==r||!$("detail").classList.contains("open")){liveStop();return}
    if(document.hidden||liveBusy)return;
    liveBusy=true;
    fetch(B+"/tokens/v1/"+encodeURIComponent(r.c)+"/"+encodeURIComponent(r.addr)).then(function(x){return x.json()}).then(function(l){
      if(cur!==r||!Array.isArray(l))return;
      var raw=l.filter(function(x){return x.pairAddress===r.pair})[0];if(!raw)return;
      var n=map(raw),el=$("lp"),lc=$("lc");
      if(!(n.p>0)||!el)return;
      if(n.p!==r.p){el.style.color=n.p>r.p?"var(--up)":"var(--down)";clearTimeout(el._t);el._t=setTimeout(function(){el.style.color=""},700)}
      el.textContent=fprice(n.p);
      lc.className=n.h24>=0?"up":"down";lc.textContent=(n.h24>=0?"+":"")+n.h24.toFixed(2)+"%";
      r.p=n.p;r.h24=n.h24;
    }).catch(function(){}).then(function(){liveBusy=false});
  },1000);
}
var ckId=0,ckRow=null;
$("ckc").innerHTML='<option value="auto">Auto-detect network</option><option value="solana">solana</option>'+Object.keys(GP_CHAIN).map(function(c){return'<option value="'+c+'">'+c+'</option>'}).join("");
function ckMsg(t){$("ckout").innerHTML='<div class="rbox q">'+t+'</div>'}
function scanToken(){
  var a=$("cka").value.trim(),sel=$("ckc").value,evm=/^0x[a-fA-F0-9]{40}$/.test(a),sol=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  if(!evm&&!sol)return ckMsg("Paste a valid token contract address (EVM 0x… or Solana).");
  if(sel!=="auto"&&(sel==="solana")!==sol)return ckMsg("That address format does not match the selected network.");
  var id=++ckId;ckMsg("Scanning…");
  fetch(sel==="auto"?B+"/latest/dex/tokens/"+a:B+"/tokens/v1/"+sel+"/"+a).then(function(x){return x.json()}).then(function(d){
    var raw=(Array.isArray(d)?d:(d.pairs||[])).filter(function(x){return x.baseToken&&x.baseToken.address&&x.baseToken.address.toLowerCase()===a.toLowerCase()});
    return dedupe(raw.map(map)).sort(function(x,y){return y.l-x.l})[0]||null;
  }).catch(function(){return false}).then(function(r){
    if(id!==ckId)return;
    var c=r?r.c:(sel!=="auto"?sel:(sol?"solana":null));
    if(!c)return ckMsg(r===false?"Could not reach DexScreener. Check your connection, or choose the network to run the contract scan only.":"No trading pair found, so the network is unknown. Choose the network above and scan again.");
    var rr=r||{c:c,addr:a,s:a.slice(0,6)+"…"+a.slice(-4),q:"",dex:"",url:""};
    var h=r?'<div class="rbox" style="margin-top:0"><div class="hd"><div><b>'+esc(r.s)+'/'+esc(r.q)+'</b><div class="q">'+esc(r.c)+' · '+esc(r.dex)+'</div></div><div class="big" style="margin:0;font-size:20px">'+fprice(r.p)+' <span class="'+(r.h24>=0?"up":"down")+'" style="font-size:14px">'+(r.h24>=0?"+":"")+r.h24.toFixed(2)+'%</span></div></div><div class="grid"><div class="st"><span>Volume 24h</span><b>'+fm(r.v)+'</b></div><div class="st"><span>Liquidity</span><b>'+fm(r.l)+'</b></div><div class="st"><span>FDV</span><b>'+fm(r.f)+'</b></div><div class="st"><span>Age</span><b>'+fage(r.t)+'</b></div></div></div>'+riskHTML(r)+momHTML(r)
      :'<div class="rbox" style="margin-top:0"><b>'+esc(rr.s)+'</b><div class="q">'+esc(c)+' · '+(r===false?"market data unavailable":"no trading pair found")+', so market checks are skipped. Contract scan below.</div></div>';
    h+='<div id="ckrisk" class="rbox"><b>🧪 Automated contract security</b><p class="q">Checking GoPlus security data…</p></div><div class="rbox"><b>↗ Trade &amp; more checks</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">'+tradeLinks(rr)+(c==="solana"?'<a target="_blank" rel="noopener" href="https://rugcheck.xyz/tokens/'+a+'">RugCheck ↗</a>':'')+(TS_CHAIN[c]?'<a target="_blank" rel="noopener" href="https://tokensniffer.com/token/'+TS_CHAIN[c]+'/'+a+'">TokenSniffer ↗</a>':'')+(r?'<a target="_blank" rel="noopener" href="'+esc(r.url)+'">DexScreener ↗</a><button type="button" class="tf" data-ckopen="1">Chart &amp; details</button>':'')+'<button type="button" class="tf" data-ckcopy="1">Copy address</button></div><small>Confirm the network and contract before swapping. Trades are signed in your own wallet; PairScope never holds your keys or funds.</small></div>';
    ckRow=rr;$("ckout").innerHTML='<div id="ckverdict"></div>'+h;automatedRisk(rr,"ckrisk");ckVerdict(rr);
  });
}
$("checker").onclick=function(e){var t=e.target;
  if(t.id==="ckgo"){scanToken();return}
  if(t.getAttribute("data-ckrep")&&ckRow){cp(ckReport(ckRow),t);return}
  if(t.getAttribute("data-cklink")&&ckRow){cp(shareUrl(ckRow),t);return}
  if(t.getAttribute("data-ckopen")&&ckRow){openR(ckRow);return}
  if(t.getAttribute("data-ckcopy")&&ckRow){var ad=ckRow.addr;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ad).then(function(){t.textContent="✓ Copied"},function(){prompt("Copy token address",ad)})}else{prompt("Copy token address",ad)}}};
$("cka").onkeydown=function(e){if(e.key==="Enter")scanToken()};
(function(){var h=document.querySelector('link[rel="icon"]').href;$("logo").src=h})();
tabs();chips();renderAlerts();load(false);fromUrl();tgPull();document.addEventListener("visibilitychange",function(){if(!document.hidden)tgPull()});scanFromUrl();
setTimeout(checkAlerts,4000);setInterval(checkAlerts,15000);
setInterval(function(){load(true)},5000);
