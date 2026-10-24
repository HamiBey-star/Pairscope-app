(function(){
var API="https://pairscope-featured.dr-hamzakhan0.workers.dev",g=function(i){return document.getElementById(i)},SOLWALLET="",PLANS=[],acct="";
var A58="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function d58(s){var b=[0],i,j,c;for(i=0;i<s.length;i++){c=A58.indexOf(s[i]);if(c<0)throw new Error("bad address");for(j=0;j<b.length;j++){c+=b[j]*58;b[j]=c&255;c>>=8}while(c){b.push(c&255);c>>=8}}for(i=0;i<s.length&&s[i]==="1";i++)b.push(0);return new Uint8Array(b.reverse())}
function e58(u){var d=[0],i,j,c,s="";for(i=0;i<u.length;i++){c=u[i];for(j=0;j<d.length;j++){c+=d[j]<<8;d[j]=c%58;c=(c/58)|0}while(c){d.push(c%58);c=(c/58)|0}}for(i=0;i<u.length&&u[i]===0;i++)s+="1";for(i=d.length-1;i>=0;i--)s+=A58[d[i]];return s}
function phantom(){var p=(window.phantom&&window.phantom.solana)||window.solana;return p&&p.isPhantom?p:null}
function msg(t,bad){var m=g("fpmsg");if(m){m.style.color=bad?"var(--down)":"var(--muted)";m.textContent=t}}
function post(path,body){return fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json()})}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function transferTx(from,to,lamports,bh){
  var out=[],push=function(a){for(var i=0;i<a.length;i++)out.push(a[i])};
  push([1]);push(new Uint8Array(64));            // 1 empty signature slot
  push([1,0,1,3]);                                // header + 3 accounts
  push(d58(from));push(d58(to));push(new Uint8Array(32)); // payer, receiver, System Program
  push(d58(bh));                                  // recent blockhash
  push([1,2,2,0,1,12]);                           // 1 ix: program idx 2, accts [0,1], 12 bytes data
  push([2,0,0,0]);                                // transfer instruction
  var v=BigInt(lamports),i;for(i=0;i<8;i++){out.push(Number(v&255n));v>>=8n}
  return new Uint8Array(out);
}
function load(){
  fetch(API+"/plans").then(function(r){return r.json()}).then(function(d){
    SOLWALLET=d.wallet;PLANS=d.plans;
    g("fpchain").innerHTML=d.chains.map(function(c){return'<option value="'+c+'">'+c+'</option>'}).join("");
    g("fpplan").innerHTML=d.plans.map(function(p){return'<option value="'+p.id+'">'+p.label+' · '+p.sol+' SOL</option>'}).join("");
    g("fpinfo").textContent="Pick your token and a plan, then pay with Phantom. It goes live right after the payment confirms.";
  }).catch(function(){g("fpinfo").textContent="Could not load plans. Please try again later."});
}
function submit(chain,address,plan,sig,tries){
  return post("/submit",{chain:chain,address:address,plan:plan,sig:sig}).then(function(r){
    if(r.ok)return r;
    if(r.pending&&tries<8)return sleep(4000).then(function(){return submit(chain,address,plan,sig,tries+1)});
    throw new Error(r.error||"Payment is still confirming. Message us your signature: "+sig);
  });
}
function pay(){
  var chain=g("fpchain").value,address=g("fpaddr").value.trim(),pid=g("fpplan").value,p=PLANS.filter(function(x){return x.id===pid})[0],ph=phantom();
  if(!address){msg("Enter the token address.",1);return}
  if(!ph){msg("Phantom wallet not found. Install Phantom or open this page in its in-app browser.",1);return}
  g("fppay").disabled=true;msg("Checking token…");
  post("/precheck",{chain:chain,address:address}).then(function(r){
    if(!r.ok)throw new Error(r.error);
    msg("Found "+r.token.symbol+". Connecting wallet…");
    return ph.connect()
  }).then(function(x){acct=x.publicKey.toString();}).then(function(x){acct=x.publicKey.toString();return post("/intent",{chain:chain,address:address,plan:pid,payer:acct}).catch(function(){}).then(function(){return fetch(API+"/blockhash").then(function(r){return r.json()})})})
  .then(function(b){
    msg("Confirm the payment in Phantom…");
    var tx=transferTx(acct,SOLWALLET,Math.round(p.sol*1e9),b.blockhash);
    return ph.request({method:"signAndSendTransaction",params:{message:e58(tx)}})
  }).then(function(x){
    var sig=x.signature||x;msg("Payment sent. Waiting for confirmation…");
    return submit(chain,address,pid,sig,0)
  }).then(function(){
    msg("✅ Done! Your token is now featured and announced.");
    g("fpaddr").value="";
    if(typeof load==="function"&&window.__fpReload)window.__fpReload();
  }).catch(function(e){
    var m=e&&e.code===4001?"Payment cancelled.":(e&&e.message)||"Something went wrong.";msg(m,1)
  }).then(function(){g("fppay").disabled=false});
}
g("fpconn").onclick=function(){var ph=phantom();if(!ph){msg("Phantom wallet not found.",1);return}ph.connect().then(function(x){acct=x.publicKey.toString();g("fpconn").textContent="Connected "+acct.slice(0,4)+"…"+acct.slice(-4)}).catch(function(){msg("Wallet connection rejected.",1)})};
g("fppay").onclick=pay;
g("lst").addEventListener("click",function(){if(!PLANS.length)load()});
})();
