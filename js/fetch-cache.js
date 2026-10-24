/* PairScope upgrade: client-side API cache + in-flight dedupe (cuts rate-limit hits)
   + optional routing of shared DexScreener lists through the pairscope-data worker (off by default:
   the worker's shared Cloudflare IP got rate-limited by DexScreener, so direct calls work better). */
(function(){var of=window.fetch.bind(window),C=new Map(),F=new Map(),
T=[["https://api.dexscreener.com/",2e3],["https://api.geckoterminal.com/",3e4],["https://api.gopluslabs.io/",6e5]],
DS="https://api.dexscreener.com/",W="https://pairscope-data.dr-hamzakhan0.workers.dev/",
SHARED=/^https:\/\/api\.dexscreener\.com\/(token-boosts|token-profiles)\//,down=0,
USE_WORKER=false; /* set to true to route boosts/profiles through the pairscope-data worker */
function ttl(u){for(var i=0;i<T.length;i++)if(u.indexOf(T[i][0])===0)return T[i][1];return 0}
function go(u,o){var v=USE_WORKER&&SHARED.test(u)&&Date.now()>down?W+u.slice(DS.length):u;
if(v===u)return of(u,o);
return of(v,o).then(function(r){if(r.ok)return r;down=Date.now()+6e4;return of(u,o)},function(){down=Date.now()+6e4;return of(u,o)})}
window.fetch=function(u,o){var url=typeof u==="string"?u:"",t=(!o||(!o.method||o.method==="GET")&&!o.signal)?ttl(url):0;
if(!t)return of(u,o);
var h=C.get(url);if(h&&Date.now()-h.t<t)return Promise.resolve(h.r.clone());
var f=F.get(url);if(f)return f.then(function(r){return r.clone()});
f=go(u,o).then(function(r){F.delete(url);if(r.ok){C.set(url,{t:Date.now(),r:r.clone()});if(C.size>300)C.delete(C.keys().next().value)}return r},function(e){F.delete(url);throw e});
F.set(url,f);return f.then(function(r){return r.clone()})}})();
