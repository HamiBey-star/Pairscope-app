/* Cloudflare Pages Function: /img?u=<https DexScreener image url>
   Lets the share-card canvas use the coin's picture. Browsers refuse to export a canvas that drew a
   cross-origin image unless that server allows it, so we fetch the picture here and serve it from your own
   domain. Only DexScreener hosts are allowed (no open proxy). Only /img and /s run functions (_routes.json). */

export function allowed(u){
  try{const x=new URL(u);return x.protocol==="https:"&&/(^|\.)dexscreener\.com$/.test(x.hostname)&&!x.username&&!x.password?x.href:""}catch(e){return ""}
}

export async function onRequest(ctx){
  const src=allowed(new URL(ctx.request.url).searchParams.get("u")||"");
  if(!src)return new Response("bad request",{status:400});
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),4000);
  try{
    const r=await fetch(src,{signal:ac.signal,redirect:"manual",cf:{cacheTtl:86400,cacheEverything:true}});
    const type=(r.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!r.ok||!/^image\/(png|jpeg|webp|gif)$/.test(type))return new Response("not found",{status:404,headers:{"Cache-Control":"public, max-age=300"}});
    const buf=await r.arrayBuffer();
    if(buf.byteLength>2*1024*1024)return new Response("too large",{status:413});
    return new Response(buf,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400","X-Content-Type-Options":"nosniff"}});
  }catch(e){return new Response("unavailable",{status:502})}
  finally{clearTimeout(t)}
}
