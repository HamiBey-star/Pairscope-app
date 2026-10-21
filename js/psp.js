(function(){
  /* ===== EDIT THESE TWO LINES ===== */
  var PSP_CA="8VGiuPDzrvC9bXVHnt6bbriFMSS2TPXWMLth1joepump";
  var PSP_CHAIN="solana";   /* solana | ethereum | base | bsc */
  /* ================================ */
  var d=document,g=function(i){return d.getElementById(i)};
  if(!PSP_CA)return;
  var ex={solana:"https://solscan.io/token/",ethereum:"https://etherscan.io/token/",base:"https://basescan.org/token/",bsc:"https://bscscan.com/token/"};
  g("pspca").textContent=PSP_CA;g("psptag").textContent="LIVE";g("pspbtns").hidden=false;
  g("pspdex").href="https://dexscreener.com/"+PSP_CHAIN+"/"+PSP_CA;
  g("pspbuy").href=PSP_CHAIN==="solana"?"https://jup.ag/swap/SOL-"+PSP_CA:"https://dexscreener.com/"+PSP_CHAIN+"/"+PSP_CA;
  g("psppump").href="https://pump.fun/coin/"+PSP_CA;
  if(PSP_CHAIN!=="solana")g("psppump").style.display="none";
  g("pspscan").href=(ex[PSP_CHAIN]||ex.solana)+PSP_CA;
  g("pspcopy").onclick=function(){
    var b=this,done=function(){b.textContent="Copied ✓";setTimeout(function(){b.textContent="Copy CA"},1800)};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(PSP_CA).then(done,function(){})}
    else{var t=d.createElement("textarea");t.value=PSP_CA;d.body.appendChild(t);t.select();try{d.execCommand("copy");done()}catch(e){}d.body.removeChild(t)}
  };
  /* share $PSP: X, Telegram, WhatsApp, native share / copy link */
  var shareLink=location.origin+location.pathname+"?scan="+encodeURIComponent(PSP_CA)+"&c="+encodeURIComponent(PSP_CHAIN);
  var shareText="$PSP is the community coin of PairScope, the free DEX scanner with built-in contract safety checks. Check it yourself:";
  g("pspshare").hidden=false;
  g("pspx").href="https://twitter.com/intent/tweet?text="+encodeURIComponent(shareText)+"&url="+encodeURIComponent(shareLink);
  g("psptg").href="https://t.me/share/url?url="+encodeURIComponent(shareLink)+"&text="+encodeURIComponent(shareText);
  g("pspwa").href="https://wa.me/?text="+encodeURIComponent(shareText+" "+shareLink);
  g("pspsharebtn").onclick=function(){
    var b=this,done=function(){b.textContent="Link copied ✓";setTimeout(function(){b.textContent="🔗 Share"},1800)};
    if(navigator.share){navigator.share({title:"$PSP on PairScope",text:shareText,url:shareLink}).catch(function(){});return}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(shareLink).then(done,function(){prompt("Copy this link",shareLink)})}
    else{prompt("Copy this link",shareLink)}
  };
})();
