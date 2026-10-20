/* PairScope upgrade: client-side API cache + in-flight dedupe (cuts rate-limit hits) */
(function(){var of=window.fetch.bind(window),C=new Map(),F=new Map(),
T=[["https://api.dexscreener.com/",4e3],["https://api.geckoterminal.com/",3e4],["https://api.gopluslabs.io/",6e5]];
function ttl(u){for(var i=0;i<T.length;i++)if(u.indexOf(T[i][0])===0)return T[i][1];return 0}
window.fetch=function(u,o){var url=typeof u==="string"?u:"",t=(!o||(!o.method||o.method==="GET")&&!o.signal)?ttl(url):0;
if(!t)return of(u,o);
var h=C.get(url);if(h&&Date.now()-h.t<t)return Promise.resolve(h.r.clone());
var f=F.get(url);if(f)return f.then(function(r){return r.clone()});
f=of(u,o).then(function(r){F.delete(url);if(r.ok){C.set(url,{t:Date.now(),r:r.clone()});if(C.size>300)C.delete(C.keys().next().value)}return r},function(e){F.delete(url);throw e});
F.set(url,f);return f.then(function(r){return r.clone()})}})();
