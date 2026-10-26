/* PairScope track record: renders data/track-record.json. Text only (no innerHTML), so entries cannot inject markup. */
(function(){
var OUT={rugged:["Rugged","b-bad"],down50:["Dropped 50%+","b-bad"],mixed:["Mixed or flat","b-mid"],up:["Went up (miss)","b-miss"],pending:["Pending","b-pend"]};
var D=/^\d{4}-\d{2}-\d{2}$/,CH=/^[a-z0-9-]{2,30}$/,AD=/^[A-Za-z0-9]{20,80}$/;
function $(i){return document.getElementById(i)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function meta(l,v){var s=el("span");s.appendChild(document.createTextNode(l+" "));s.appendChild(el("b",null,v));return s}
function valid(e){return e&&typeof e==="object"&&OUT[e.o]&&D.test(e.d||"")&&typeof e.s==="string"&&e.s.length<=24}
function card(e){
  var li=el("li","entry"),h=el("div","eh"),l=el("div"),o=OUT[e.o];
  l.appendChild(el("span","es",e.s));
  if(e.c&&CH.test(e.c))l.appendChild(el("span","ec",e.c));
  h.appendChild(l);h.appendChild(el("span","badge "+o[1],o[0]));li.appendChild(h);
  var m=el("div","em");m.appendChild(meta("Flagged",e.d));
  if(typeof e.rs==="number")m.appendChild(meta("Risk score",String(Math.round(e.rs))));
  if(D.test(e.oc||""))m.appendChild(meta("Checked",e.oc));
  li.appendChild(m);
  if(e.why&&typeof e.why==="string")li.appendChild(el("p","ew",e.why.slice(0,240)));
  if(e.n&&typeof e.n==="string")li.appendChild(el("p","en","Note: "+e.n.slice(0,240)));
  if(e.c&&CH.test(e.c)&&e.a&&AD.test(e.a)){
    var p=el("p","el"),a=el("a",null,"View on DexScreener");
    a.href="https://dexscreener.com/"+e.c+"/"+e.a;a.target="_blank";a.rel="noopener";p.appendChild(a);li.appendChild(p)}
  return li}
/* owner-only share helper: visible at track-record.html#share. Builds ready-to-post text from the log. */
var URL_TXT="pairscope.online/track-record";
function tlen(t){return t.length-URL_TXT.length+23}
function today(){return new Date().toISOString().slice(0,10)}
function dailyText(list){
  if(!list.length)return"";
  var latest=list.reduce(function(m,e){return e.d>m?e.d:m},"0000-00-00");
  var xs=list.filter(function(e){return e.d===latest&&typeof e.rs==="number"}).sort(function(a,b){return a.rs-b.rs});
  if(!xs.length)return"";
  var when=latest===today()?"today":"on "+latest;
  var head="PairScope flagged "+xs.length+" new Solana pair"+(xs.length>1?"s":"")+" "+when+" (Risk score under 50):\n";
  var foot="\n\nAutomated estimate, not an audit or advice.\nFull log: "+URL_TXT;
  function build(max,reason){
    var lines=xs.slice(0,max).map(function(e){var r=reason&&e.why?": "+String(e.why).split(";")[0].trim():"";return"• "+e.s+", Risk "+Math.round(e.rs)+r});
    if(xs.length>max)lines.push("+ "+(xs.length-max)+" more in the log");
    return head+lines.join("\n")+foot}
  var tries=[[xs.length,true],[xs.length,false],[4,false],[3,false],[2,false],[1,false]];
  for(var i=0;i<tries.length;i++){var t=build(tries[i][0],tries[i][1]);if(tlen(t)<=280)return t}
  return build(1,false)}
function weeklyText(list){
  var t=today(),from=new Date(Date.parse(t+"T00:00:00Z")-7*864e5).toISOString().slice(0,10);
  var r=list.filter(function(e){return e.o!=="pending"&&D.test(e.oc||"")&&e.oc>from});
  if(!r.length)return"";
  var bad=0,mid=0,up=0;r.forEach(function(e){if(e.o==="rugged"||e.o==="down50")bad++;else if(e.o==="mixed")mid++;else up++});
  return"7-day results this week: "+r.length+" flagged token"+(r.length>1?"s":"")+" checked. "+bad+" rugged or dropped 50%+, "+mid+" mixed or flat, "+up+" went up (our misses). Small sample.\nFull log: "+URL_TXT}
function shareBlock(title,text){
  var w=el("div","sh"),ta=el("textarea","sht"),st=el("p","muted"),row=el("div","shr"),c=el("button","shb","Copy post"),x=el("a","shb","Post on X"),n=el("span","muted");
  w.appendChild(el("h3",null,title));ta.value=text;ta.rows=7;ta.setAttribute("aria-label",title);
  function upd(){var l=tlen(ta.value);n.textContent=l+" / 280";n.className=l>280?"muted over":"muted";x.href="https://x.com/intent/post?text="+encodeURIComponent(ta.value)}
  ta.addEventListener("input",upd);upd();
  x.target="_blank";x.rel="noopener";c.type="button";
  c.addEventListener("click",function(){
    function ok(){st.textContent="Copied."}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).then(ok,function(){ta.select();document.execCommand("copy");ok()})}
    else{ta.select();document.execCommand("copy");ok()}});
  st.setAttribute("role","status");
  row.appendChild(c);row.appendChild(x);row.appendChild(n);
  w.appendChild(ta);w.appendChild(row);w.appendChild(st);return w}
function setupShare(list){
  var sec=$("share");if(!sec||location.hash!=="#share")return;
  var b=$("share-body");b.textContent="";
  var d=dailyText(list),w=weeklyText(list);
  if(d)b.appendChild(shareBlock("Daily post",d));
  if(w)b.appendChild(shareBlock("Weekly results post",w));
  if(!d&&!w)b.appendChild(el("p","muted","Nothing to post yet. Posts appear here once tokens are flagged or checked."));
  sec.hidden=false}
function render(d){
  var list=(d&&Array.isArray(d.entries)?d.entries:[]).filter(valid).sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});
  var n={rugged:0,down50:0,mixed:0,up:0,pending:0};list.forEach(function(e){n[e.o]++});
  var bad=n.rugged+n.down50,res=bad+n.mixed+n.up;
  $("st-total").textContent=list.length;$("st-bad").textContent=bad;$("st-mixed").textContent=n.mixed;$("st-up").textContent=n.up;$("st-pend").textContent=n.pending;
  $("st-note").textContent=res?bad+" of "+res+" resolved entries were rugged or dropped 50%+. Small samples prove little."+(d.updated?" Last updated "+d.updated+".":""):"Resolved means checked after 7 days. No entries have been resolved yet.";
  var ul=$("entries");ul.textContent="";
  if(!list.length){$("status").textContent="No entries yet. The first batch will be published here once flagged tokens have been checked.";setupShare(list);return}
  $("status").textContent="";list.forEach(function(e){ul.appendChild(card(e))});setupShare(list)}
fetch("data/track-record.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(render)
.catch(function(){$("status").textContent="Could not load the record right now. Please try again shortly."});
})();
