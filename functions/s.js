/* Cloudflare Pages Function: /s?scan=<address>&c=<chain>   (or /s?a=<address>&c=<chain>)
   Share links point here. Link-preview bots (X, Telegram, WhatsApp, Discord...) get a tiny page with
   token-specific preview tags (name, price, 24h, liquidity, token icon). Everyone else is redirected
   straight to the live app, so normal visitors never wait on this. Only /s runs this code (see _routes.json). */

const BOT=/(twitterbot|telegrambot|facebookexternalhit|facebot|whatsapp|discordbot|slackbot|linkedinbot|skypeuripreview|redditbot|embedly|pinterest|vkshare|viber|googlebot|bingbot|applebot)/i;
const EVM=/^0x[a-fA-F0-9]{40}$/, SOL=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, CHAIN=/^[a-z0-9-]{2,20}$/;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clean=(s,n)=>String(s==null?"":s).replace(/[\u0000-\u001f\u007f<>]/g,"").trim().slice(0,n);

function fmtPrice(p){
  p=Number(p);if(!isFinite(p)||p<=0)return "";
  if(p>=1)return "$"+p.toLocaleString("en-US",{maximumFractionDigits:2});
  const dec=Math.min(12,Math.max(2,-Math.floor(Math.log10(p))+3));
  return "$"+p.toFixed(dec);
}
function fmtUsd(n){
  n=Number(n);if(!isFinite(n)||n<=0)return "";
  if(n>=1e9)return "$"+(n/1e9).toFixed(2)+"B";
  if(n>=1e6)return "$"+(n/1e6).toFixed(2)+"M";
  if(n>=1e3)return "$"+(n/1e3).toFixed(1)+"K";
  return "$"+Math.round(n);
}
const CHAIN_NAMES={solana:"Solana",ethereum:"Ethereum",base:"Base",bsc:"BNB Chain",arbitrum:"Arbitrum",polygon:"Polygon",avalanche:"Avalanche",optimism:"Optimism"};

export function pickPair(pairs,addr,chain){
  if(!Array.isArray(pairs)||!pairs.length)return null;
  const a=addr.toLowerCase();
  let list=pairs.filter(p=>p&&p.baseToken&&String(p.baseToken.address).toLowerCase()===a);
  if(!list.length)list=pairs.filter(p=>p&&p.baseToken);
  if(chain){const byChain=list.filter(p=>p.chainId===chain);if(byChain.length)list=byChain}
  list.sort((x,y)=>((y.liquidity&&y.liquidity.usd)||0)-((x.liquidity&&x.liquidity.usd)||0));
  return list[0]||null;
}

export function toToken(p){
  if(!p)return null;
  let img="";
  try{const u=new URL(p.info&&p.info.imageUrl||"");if(u.protocol==="https:"&&/(^|\.)dexscreener\.com$/.test(u.hostname))img=u.href}catch(e){}
  return{
    sym:clean(p.baseToken.symbol,20),name:clean(p.baseToken.name,40),chain:String(p.chainId||""),
    price:fmtPrice(p.priceUsd),h24:p.priceChange&&isFinite(p.priceChange.h24)?Number(p.priceChange.h24):null,
    liq:fmtUsd(p.liquidity&&p.liquidity.usd),img
  };
}

export function buildPage(tok,dest,origin,selfUrl){
  const chainName=tok?(CHAIN_NAMES[tok.chain]||tok.chain):"";
  const title=tok&&tok.sym?`${tok.sym}${tok.name&&tok.name!==tok.sym?" ("+tok.name+")":""} on ${chainName} | PairScope scan`:"Token scan | PairScope";
  const bits=[];
  if(tok){
    if(tok.price)bits.push(tok.price);
    if(tok.h24!==null)bits.push("24h "+(tok.h24>=0?"+":"")+tok.h24.toFixed(1)+"%");
    if(tok.liq)bits.push("Liq "+tok.liq);
  }
  const desc=(bits.length?bits.join(" · ")+". ":"")+"Free contract safety check and Risk Radar on PairScope. Not financial advice.";
  const hasIcon=!!(tok&&tok.img);
  const img=hasIcon?tok.img:origin+"/og.jpg";
  const card=hasIcon?"summary":"summary_large_image";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,follow">
<meta property="og:type" content="website"><meta property="og:site_name" content="PairScope">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(selfUrl)}"><meta property="og:image" content="${esc(img)}">${hasIcon?"":'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}
<meta name="twitter:card" content="${card}"><meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#0b0e11">
<script>location.replace(${JSON.stringify(dest).replace(/</g,"\\u003c")})</script></head>
<body style="background:#0b0e11;color:#a9b6c3;font:16px system-ui,sans-serif;padding:24px"><p>Opening on PairScope… <a style="color:#4b9bff" href="${esc(dest)}">Tap here if nothing happens</a></p></body></html>`;
}

async function lookup(addr,chain){
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),2500);
  try{
    const r=await fetch("https://api.dexscreener.com/latest/dex/tokens/"+encodeURIComponent(addr),{signal:ac.signal,cf:{cacheTtl:120,cacheEverything:true}});
    if(!r.ok)return null;
    const j=await r.json();
    return toToken(pickPair(j&&j.pairs,addr,chain));
  }finally{clearTimeout(t)}
}

export async function onRequest(ctx){
  const url=new URL(ctx.request.url);
  const q=url.searchParams, viaA=q.has("a")&&!q.has("scan");
  const addr=clean(q.get("scan")||q.get("a")||"",64);
  const chain=clean(q.get("c")||"",20).toLowerCase();
  const valid=(EVM.test(addr)||SOL.test(addr))&&(!chain||CHAIN.test(chain));
  let dest="/";
  if(valid){
    dest=viaA?"/?c="+encodeURIComponent(chain||"auto")+"&a="+encodeURIComponent(addr)
             :"/?scan="+encodeURIComponent(addr)+(chain&&chain!=="auto"?"&c="+encodeURIComponent(chain):"");
  }
  const ua=ctx.request.headers.get("user-agent")||"";
  if(!valid||!BOT.test(ua))return new Response(null,{status:302,headers:{Location:dest,"Cache-Control":"no-store"}});
  let tok=null;try{tok=await lookup(addr,chain==="auto"?"":chain)}catch(e){}
  return new Response(buildPage(tok,dest,url.origin,url.href),{headers:{
    "Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=300","Vary":"User-Agent"}});
}
