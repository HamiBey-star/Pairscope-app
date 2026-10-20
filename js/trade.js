/* PairScope in-site Buy/Sell via the user's own wallet (MetaMask-type EVM wallets and Phantom).
   Separate block: it only wraps openR() to add a panel and does not change any existing function. */
(function(){
var EV={ethereum:1,bsc:56,base:8453,arbitrum:42161,optimism:10,polygon:137,avalanche:43114};
var NAT={ethereum:"ETH",bsc:"BNB",base:"ETH",arbitrum:"ETH",optimism:"ETH",polygon:"POL",avalanche:"AVAX"};
var EXP={ethereum:"https://etherscan.io/tx/",bsc:"https://bscscan.com/tx/",base:"https://basescan.org/tx/",arbitrum:"https://arbiscan.io/tx/",optimism:"https://optimistic.etherscan.io/tx/",polygon:"https://polygonscan.com/tx/",avalanche:"https://snowtrace.io/tx/",solana:"https://solscan.io/tx/"};
var NATIVE="0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",SOLM="So11111111111111111111111111111111111111112";
var PX="https://api.paraswap.io",JU="https://lite-api.jup.ag";
var P={acct:{evm:"",sol:""},side:"buy",q:null,busy:false},SD={};

function evmP(){var e=window.ethereum;if(!e)return null;if(e.providers&&e.providers.length){return e.providers.filter(function(p){return p.isMetaMask})[0]||e.providers[0]}return e}
function solP(){var p=(window.phantom&&window.phantom.solana)||window.solana;return p&&p.isPhantom?p:null}
function rq(m,p){return evmP().request({method:m,params:p||[]})}
function hx(v){return"0x"+BigInt(v).toString(16)}
function pad(h){h=String(h).replace(/^0x/,"").toLowerCase();return"0".repeat(64-h.length)+h}
function units(s,d){s=String(s).trim();if(!/^(\d+\.?\d*|\.\d+)$/.test(s))return null;var p=s.split("."),f=(p[1]||"").slice(0,d);f=f+"0".repeat(d-f.length);var v=BigInt((p[0]||"0")+f);return v>0n?v:null}
function human(v,d,mx){var s=v.toString();if(d>0){while(s.length<=d)s="0"+s;var w=s.slice(0,s.length-d),f=s.slice(s.length-d).replace(/0+$/,"").slice(0,mx||8);s=f?w+"."+f:w}return s}
function b58(u){var A="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",d=[0],i,j,c,s="";for(i=0;i<u.length;i++){c=u[i];for(j=0;j<d.length;j++){c+=d[j]<<8;d[j]=c%58;c=(c/58)|0}while(c){d.push(c%58);c=(c/58)|0}}for(i=0;i<u.length&&u[i]===0;i++)s+="1";for(i=d.length-1;i>=0;i--)s+=A[d[i]];return s}
function jf(u,o){return fetch(u,o).then(function(x){return x.json().then(function(j){if(!x.ok)throw new Error((j&&(j.error||j.message))||("HTTP "+x.status));return j},function(){throw new Error("HTTP "+x.status)})})}
function em(e){if(e&&e.code===4001)return"Rejected in wallet.";var m=e&&(e.message||(e.error&&e.error.message))||String(e||"Unknown error");return m.length>180?m.slice(0,180)+"…":m}
function slip(){return +$("trslip").value||100}
function kind(r){return r.c==="solana"?"sol":"evm"}
function short(a){return a?a.slice(0,6)+"…"+a.slice(-4):""}
function msg(t,bad){var m=$("trmsg");if(m){m.style.color=bad?"var(--down)":"var(--muted)";m.textContent=t}}

function connect(r){
  if(r.c==="solana"){var p=solP();if(!p)return Promise.reject(new Error("Phantom wallet not found. Install Phantom, or open this page inside its in-app browser."));
    return p.connect().then(function(x){P.acct.sol=x.publicKey.toString()})}
  var e=evmP();if(!e)return Promise.reject(new Error("No EVM wallet found. Install MetaMask (or similar), or open this page inside your wallet's in-app browser."));
  return e.request({method:"eth_requestAccounts"}).then(function(a){P.acct.evm=a[0]})
}
function ensureChain(id){return rq("eth_chainId").then(function(c){if(parseInt(c,16)===id)return;return rq("wallet_switchEthereumChain",[{chainId:hx(id)}])})}
function evmDec(a){return rq("eth_call",[{to:a,data:"0x313ce567"},"latest"]).then(function(h){var d=parseInt(h,16);if(!(d>=0&&d<=36))throw new Error("Could not read token decimals.");return d})}
function solDec(a){if(SD[a]!=null)return Promise.resolve(SD[a]);
  return jf(JU+"/tokens/v2/search?query="+encodeURIComponent(a)).then(function(l){var t=(Array.isArray(l)?l:[]).filter(function(x){return x.id===a})[0];if(!t||t.decimals==null)throw new Error("Could not read token decimals.");SD[a]=t.decimals;return t.decimals})}

function qEvm(r,a){
  var id=EV[r.c],buy=P.side==="buy";
  return ensureChain(id).then(function(){return evmDec(r.addr)}).then(function(td){
    var sd=buy?18:td,dd=buy?td:18,s=buy?NATIVE:r.addr,d=buy?r.addr:NATIVE,amt=units(a,sd);
    if(!amt)throw new Error("Enter a valid amount.");
    return jf(PX+"/prices?srcToken="+s+"&srcDecimals="+sd+"&destToken="+d+"&destDecimals="+dd+"&amount="+amt+"&side=SELL&network="+id+"&version=6.2").then(function(j){
      var pr=j.priceRoute;if(!pr||!pr.destAmount)throw new Error("No route found for this token.");
      var out=BigInt(pr.destAmount);
      return{kind:"evm",pr:pr,s:s,d:d,sd:sd,dd:dd,amt:amt,out:out,min:out*BigInt(10000-slip())/10000n,sym:buy?r.s:NAT[r.c],gas:pr.gasCostUSD}})})
}
function qSol(r,a){
  var buy=P.side==="buy";
  return solDec(r.addr).then(function(td){
    var sd=buy?9:td,dd=buy?td:9,amt=units(a,sd);if(!amt)throw new Error("Enter a valid amount.");
    return jf(JU+"/swap/v1/quote?inputMint="+(buy?SOLM:r.addr)+"&outputMint="+(buy?r.addr:SOLM)+"&amount="+amt+"&slippageBps="+slip()).then(function(j){
      if(!j.outAmount)throw new Error("No route found for this token.");
      return{kind:"sol",qr:j,dd:dd,out:BigInt(j.outAmount),min:BigInt(j.otherAmountThreshold||j.outAmount),sym:buy?r.s:"SOL"}})})
}
function waitTx(h){return new Promise(function(res,rej){var n=0;(function p(){rq("eth_getTransactionReceipt",[h]).then(function(x){if(x){x.status==="0x0"?rej(new Error("Approval transaction failed.")):res()}else if(++n>90)rej(new Error("Timed out waiting for approval to confirm."));else setTimeout(p,2000)}).catch(rej)})()})}
function swEvm(r,q){
  var id=EV[r.c],buy=P.side==="buy",from=P.acct.evm;
  return ensureChain(id).then(function(){
    if(buy)return;
    var sp=q.pr.tokenTransferProxy;
    return rq("eth_call",[{to:r.addr,data:"0xdd62ed3e"+pad(from)+pad(sp)},"latest"]).then(function(al){
      if(BigInt(al)>=q.amt)return;
      msg("Step 1 of 2: approve "+r.s+" in your wallet…");
      return rq("eth_sendTransaction",[{from:from,to:r.addr,data:"0x095ea7b3"+pad(sp)+pad(hx(q.amt))}]).then(function(h){msg("Waiting for approval to confirm…");return waitTx(h)})})
  }).then(function(){
    msg("Building swap…");
    return jf(PX+"/transactions/"+id+"?ignoreChecks=true",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({srcToken:q.s,destToken:q.d,srcAmount:q.amt.toString(),srcDecimals:q.sd,destDecimals:q.dd,slippage:slip(),priceRoute:q.pr,userAddress:from,partner:"pairscope"})})
  }).then(function(t){
    msg("Confirm the swap in your wallet…");
    return rq("eth_sendTransaction",[{from:from,to:t.to,value:hx(t.value||"0"),data:t.data}])})
}
function swSol(r,q){
  var p=solP();if(!p)return Promise.reject(new Error("Phantom wallet not found."));
  msg("Building swap…");
  return jf(JU+"/swap/v1/swap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quoteResponse:q.qr,userPublicKey:P.acct.sol,dynamicComputeUnitLimit:true})}).then(function(j){
    var raw=atob(j.swapTransaction),u=new Uint8Array(raw.length),i;for(i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
    msg("Confirm the swap in Phantom…");
    return p.request({method:"signAndSendTransaction",params:{message:b58(u)}})
  }).then(function(x){return x.signature||x})
}

function sideUI(r){
  var buy=P.side==="buy",sym=r.c==="solana"?"SOL":NAT[r.c];
  Array.prototype.forEach.call(document.querySelectorAll("#trbox [data-trs]"),function(b){b.className="tf"+(b.getAttribute("data-trs")===P.side?" on":"")});
  $("tramt").placeholder="Amount in "+(buy?sym:r.s);
  $("trgo").style.display="none";$("trinfo").innerHTML="";P.q=null;
  $("trwal").textContent=P.acct[kind(r)]?"Connected "+short(P.acct[kind(r)]):"Wallet not connected";
  $("trconn").textContent=P.acct[kind(r)]?"Switch account":"Connect wallet";
}
function box(r){
  var anchor=$("detail").querySelector(".al");if(!anchor)return;
  if(!(r.c==="solana"||EV.hasOwnProperty(r.c)))return;
  P.side="buy";P.q=null;P.busy=false;
  var wn=r.c==="solana"?"Phantom":"MetaMask or any browser EVM wallet";
  anchor.insertAdjacentHTML("beforebegin",'<div class="rbox" id="trbox"><div class="hd"><b>💱 Trade in PairScope</b><span class="q" id="trwal"></span></div>'+
   '<div class="tfs" style="margin-top:10px"><button type="button" class="tf on" data-trs="buy">Buy '+esc(r.s)+'</button><button type="button" class="tf" data-trs="sell">Sell '+esc(r.s)+'</button></div>'+
   '<div class="al"><input id="tramt" type="number" step="any" min="0" inputmode="decimal"><select id="trslip" title="Max slippage"><option value="50">0.5%</option><option value="100" selected>1%</option><option value="300">3%</option><option value="500">5%</option><option value="1000">10%</option></select></div>'+
   '<div class="al"><button type="button" id="trconn">Connect wallet</button><button type="button" id="trquote">Get quote</button></div>'+
   '<div id="trinfo" style="margin-top:10px"></div><div class="al"><button type="button" id="trgo" style="display:none;flex:1"></button></div>'+
   '<div class="q" id="trmsg" style="margin-top:8px;word-break:break-word"></div>'+
   '<small>Works with '+wn+'. Trades are routed through '+(r.c==="solana"?"Jupiter":"ParaSwap")+' and signed in your own wallet. PairScope never holds your keys or funds. Always check the quote, slippage and contract before confirming.</small></div>');
  sideUI(r);
  var b=$("trbox");
  b.addEventListener("input",function(e){if(e.target.id==="tramt"||e.target.id==="trslip"){P.q=null;$("trgo").style.display="none";$("trinfo").innerHTML="";msg("")}});
  b.addEventListener("click",function(e){
    var t=e.target,s=t.getAttribute&&t.getAttribute("data-trs");
    if(s){P.side=s;sideUI(r);msg("");return}
    if(P.busy)return;
    if(t.id==="trconn"){P.busy=true;msg("Waiting for wallet…");connect(r).then(function(){sideUI(r);msg("")}).catch(function(x){msg(em(x),1)}).then(function(){P.busy=false});return}
    if(t.id==="trquote"){
      var a=$("tramt").value;if(!units(a,18)){msg("Enter an amount first.",1);return}
      P.busy=true;P.q=null;$("trgo").style.display="none";$("trinfo").innerHTML="";msg("Getting quote…");
      (P.acct[kind(r)]?Promise.resolve():connect(r)).then(function(){return r.c==="solana"?qSol(r,a):qEvm(r,a)}).then(function(q){
        if(!b.isConnected)return;P.q=q;sideUI0(r);
        var buy=P.side==="buy";
        $("trinfo").innerHTML='<div class="st"><span>You receive (estimated)</span><b>'+esc(human(q.out,q.dd))+' '+esc(q.sym)+'</b><span>Minimum after '+(slip()/100)+'% slippage: '+esc(human(q.min,q.dd))+' '+esc(q.sym)+(q.gas?' · est. gas ≈ $'+esc(String(Math.round(+q.gas*100)/100)):'')+'</span></div>'+(r.rs<50?'<div style="color:#ffb74d;font-size:12px;margin-top:6px">⚠️ High-risk token. Run the contract scan before you trade.</div>':'');
        var g=$("trgo");g.textContent=(buy?"Confirm buy":"Confirm sell")+" in wallet";g.style.display="";msg("");
      }).catch(function(x){msg(em(x),1)}).then(function(){P.busy=false;sideUI1(r)});return}
    if(t.id==="trgo"&&P.q){
      if(r.rs<50&&!confirm("This token has a high risk score. Do you still want to "+P.side+" it?"))return;
      P.busy=true;
      (P.q.kind==="sol"?swSol(r,P.q):swEvm(r,P.q)).then(function(h){
        P.q=null;$("trgo").style.display="none";$("trinfo").innerHTML="";
        var l=EXP[r.c]?'<a target="_blank" rel="noopener" href="'+EXP[r.c]+encodeURIComponent(h)+'">View transaction ↗</a>':esc(h);
        $("trmsg").style.color="var(--up)";$("trmsg").innerHTML="✓ Submitted. "+l;
      }).catch(function(x){msg(em(x),1)}).then(function(){P.busy=false});
    }
  });
}
function sideUI0(){} function sideUI1(r){var w=$("trwal");if(w)w.textContent=P.acct[kind(r)]?"Connected "+short(P.acct[kind(r)]):"Wallet not connected";var c=$("trconn");if(c)c.textContent=P.acct[kind(r)]?"Switch account":"Connect wallet"}

var _o=openR;
openR=function(r){_o(r);try{box(r)}catch(e){}};
})();
