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
function render(d){
  var list=(d&&Array.isArray(d.entries)?d.entries:[]).filter(valid).sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});
  var n={rugged:0,down50:0,mixed:0,up:0,pending:0};list.forEach(function(e){n[e.o]++});
  var bad=n.rugged+n.down50,res=bad+n.mixed+n.up;
  $("st-total").textContent=list.length;$("st-bad").textContent=bad;$("st-mixed").textContent=n.mixed;$("st-up").textContent=n.up;$("st-pend").textContent=n.pending;
  $("st-note").textContent=res?bad+" of "+res+" resolved entries were rugged or dropped 50%+. Small samples prove little."+(d.updated?" Last updated "+d.updated+".":""):"Resolved means checked after 7 days. No entries have been resolved yet.";
  var ul=$("entries");ul.textContent="";
  if(!list.length){$("status").textContent="No entries yet. The first batch will be published here once flagged tokens have been checked.";return}
  $("status").textContent="";list.forEach(function(e){ul.appendChild(card(e))})}
fetch("data/track-record.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(render)
.catch(function(){$("status").textContent="Could not load the record right now. Please try again shortly."});
})();
