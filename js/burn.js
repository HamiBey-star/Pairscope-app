(function(){
var API="https://pairscope-featured.dr-hamzakhan0.workers.dev";
var g=function(i){return document.getElementById(i)};
function post(path,body){return fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json()})}
function say(id,text,cls){var e=g(id);e.textContent=text;e.className="msg"+(cls?" "+cls:"")}
function num(n){return Number(n).toLocaleString("en-US")}
function show(info){
  g("amt").textContent=num(info.amount);g("days").textContent=info.days;
  var a=document.getElementsByClassName("amt2");for(var i=0;i<a.length;i++)a[i].textContent=num(info.amount);
  g("mint").textContent=info.mint;
}
var chains=["solana","ethereum","bsc","base","arbitrum","optimism","polygon","avalanche"];
function fillChains(list){var s=g("chain");s.textContent="";list.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;s.appendChild(o)})}
fillChains(chains);
fetch(API+"/plans").then(function(r){return r.json()}).then(function(d){if(d&&Array.isArray(d.chains)&&d.chains.length)fillChains(d.chains)}).catch(function(){});
fetch(API+"/burninfo").then(function(r){return r.json()}).then(function(d){if(d&&d.mint)show(d)}).catch(function(){});

g("reg").onclick=function(){
  var b=this,addr=g("addr").value.trim(),wallet=g("wallet").value.trim();
  if(!addr||!wallet){say("msg1","Enter the token address and your wallet address.","err");return}
  b.disabled=true;say("msg1","Checking the token...");
  post("/burnintent",{chain:g("chain").value,address:addr,wallet:wallet}).then(function(d){
    b.disabled=false;
    if(!d||!d.ok){say("msg1",(d&&d.error)||"Something went wrong. Try again.","err");return}
    show(d);
    say("msg1","Request saved for "+(d.token&&d.token.symbol?d.token.symbol:"your token")+". Now burn the $PSP (step 2). The request is valid for 30 minutes.","ok");
    g("step2").hidden=false;
  }).catch(function(){b.disabled=false;say("msg1","Could not reach the server. Try again.","err")});
};

g("go").onclick=function(){
  var b=this,sig=g("sig").value.trim();
  if(!sig){say("msg2","Paste the transaction signature of your burn.","err");return}
  b.disabled=true;say("msg2","Verifying the burn on-chain. This can take up to 30 seconds...");
  post("/burn",{sig:sig}).then(function(d){
    b.disabled=false;
    if(d&&d.ok){say("msg2","Done. Your token is now featured on PairScope.","ok");return}
    if(d&&d.pending){say("msg2","The transaction is not confirmed yet. Wait a little and press the button again.");return}
    say("msg2",(d&&d.error)||"Something went wrong. Try again.","err");
  }).catch(function(){b.disabled=false;say("msg2","Could not reach the server. Try again.","err")});
};
})();
