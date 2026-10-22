// Server-rendered token page for search engines. Same Risk Radar rules as js/core.js.
const CHAIN_RE = /^[a-z0-9-]{2,24}$/;
const ADDR_RE = /^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/;
const MIN_INDEX_LIQ = 5000; // pages for tiny pools are marked noindex

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => {
  n = +n || 0;
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
};
const price = (p) => {
  p = +p || 0;
  if (!(p > 0)) return "n/a";
  const d = p >= 1 ? 2 : Math.min(12, 2 - Math.floor(Math.log10(p)) + 1);
  return "$" + p.toFixed(d);
};
const pct = (n) => (n > 0 ? "+" : "") + (+n || 0).toFixed(1) + "%";
const ageText = (t) => {
  if (!t) return "unknown";
  const h = (Date.now() - t) / 36e5;
  if (h < 1) return "under 1 hour";
  if (h < 48) return Math.round(h) + " hours";
  return Math.round(h / 24) + " days";
};

function risk(o) {
  let s = 100; const n = [];
  const bad = (p, t) => { s -= p; n.push({ b: 1, t }); };
  const ok = (t) => n.push({ b: 0, t });
  if (!o.t) bad(8, "Pair age unknown");
  else {
    const hrs = (Date.now() - o.t) / 36e5;
    if (hrs < 1) bad(25, "Launched under 1 hour ago");
    else if (hrs < 24) bad(15, "Less than 24 hours old");
    else if (hrs < 168) bad(6, "Less than a week old");
    else ok("Trading for " + ageText(o.t));
  }
  if (o.l < 5000) bad(35, "Very low liquidity (" + money(o.l) + "): easy to manipulate");
  else if (o.l < 20000) bad(25, "Low liquidity (" + money(o.l) + ")");
  else if (o.l < 50000) bad(12, "Below-average liquidity (" + money(o.l) + ")");
  else if (o.l < 100000) bad(5, "Moderate liquidity (" + money(o.l) + ")");
  else ok("Healthy liquidity (" + money(o.l) + ")");
  if (o.f > 0) {
    const lf = o.l / o.f;
    if (lf < 0.01) bad(12, "Liquidity is under 1% of valuation: a modest sell could crash the price");
    else if (lf < 0.03) bad(6, "Liquidity is thin compared to valuation");
    else ok("Liquidity is reasonable versus valuation");
  }
  if (o.l > 0 && o.v / o.l > 20) bad(10, "Volume is " + Math.round(o.v / o.l) + "x liquidity: possible hype or wash trading");
  if (o.sl === 0 && o.b >= 30) bad(20, "Many buys but zero sells: possible honeypot (can't sell)");
  else if (o.tx >= 50 && o.sl > o.b * 1.5) bad(10, "Sellers heavily outnumber buyers");
  else if (o.tx >= 50) ok("Buys and sells look balanced");
  if (o.tx < 50) bad(10, "Very few trades (under 50 in 24h)");
  if (Math.abs(o.h24) > 200) bad(12, "Price moved over 200% in 24h");
  else if (Math.abs(o.h1) > 50) bad(8, "Price moved over 50% in the last hour");
  n.sort((a, b) => b.b - a.b);
  return { s: Math.max(0, Math.min(100, s)), n };
}
const label = (s) => (s >= 75 ? "Lower risk" : s >= 50 ? "Caution" : "High risk");

function page({ status, title, desc, canonical, noindex, body }) {
  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/css/token.css">
</head><body><main class="wrap">
<p><a href="/">← PairScope</a> · <a href="/methodology">How scores work</a></p>
${body}
<p class="muted">Not financial advice. Scores are automated estimates from public market data, not audits or guarantees. Data from DexScreener.</p>
</main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=300" : "public, max-age=60",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
}
const notFound = (msg) => page({ status: 404, title: "Token not found | PairScope", desc: msg, noindex: true,
  body: `<h1>Token not found</h1><p>${esc(msg)}</p><p><a href="/">Scan a token on PairScope</a></p>` });

export async function onRequestGet(context) {
  const chain = String(context.params.chain || "").toLowerCase();
  const address = String(context.params.address || "");
  if (!CHAIN_RE.test(chain) || !ADDR_RE.test(address)) return notFound("That chain or address is not valid.");

  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = new Request("https://pairscope.online/token/" + chain + "/" + address.toLowerCase());
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }

  let pairs;
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch("https://api.dexscreener.com/tokens/v1/" + chain + "/" + address, { signal: ctl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error("status " + res.status);
    pairs = await res.json();
  } catch (e) {
    return page({ status: 503, title: "Temporarily unavailable | PairScope", desc: "Market data is temporarily unavailable.", noindex: true,
      body: "<h1>Temporarily unavailable</h1><p>Market data could not be loaded. Please try again in a minute.</p>" });
  }

  let best = null;
  for (const p of Array.isArray(pairs) ? pairs : []) {
    if (!p.baseToken || String(p.baseToken.address).toLowerCase() !== address.toLowerCase()) continue;
    const l = (p.liquidity && p.liquidity.usd) || 0;
    if (!best || l > ((best.liquidity && best.liquidity.usd) || 0)) best = p;
  }
  if (!best) return notFound("No trading pair was found for this token on " + chain + ".");

  const pc = best.priceChange || {}, tx = (best.txns && best.txns.h24) || {};
  const o = { t: best.pairCreatedAt || 0, l: (best.liquidity && best.liquidity.usd) || 0, f: best.fdv || 0,
    v: (best.volume && best.volume.h24) || 0, b: tx.buys || 0, sl: tx.sells || 0, tx: (tx.buys || 0) + (tx.sells || 0),
    h1: pc.h1 || 0, h24: pc.h24 || 0 };
  const r = risk(o);
  const sym = best.baseToken.symbol || "Token", name = best.baseToken.name || sym;
  const url = "https://pairscope.online/token/" + chain + "/" + address;
  const title = sym + " token safety check: Risk " + r.s + "/100 | PairScope";
  const desc = name + " (" + sym + ") on " + chain + ": Risk Radar " + r.s + "/100 (" + label(r.s) + "), liquidity " + money(o.l) + ", 24h volume " + money(o.v) + ". Market-based risk checks, not financial advice.";
  const rows = [["Price", price(best.priceUsd)], ["24h change", pct(o.h24)], ["Liquidity", money(o.l)], ["24h volume", money(o.v)],
    ["Fully diluted valuation", o.f ? money(o.f) : "n/a"], ["Pair age", ageText(o.t)], ["24h trades", o.b + " buys / " + o.sl + " sells"],
    ["Exchange", best.dexId || "n/a"]];
  const body = `<h1>${esc(name)} (${esc(sym)}) safety check</h1>
<p class="muted">${esc(chain)} · ${esc(address)}</p>
<div class="box"><b>Risk Radar: ${r.s}/100 · ${label(r.s)}</b><br><span class="muted">Estimated from market data only.</span></div>
<h2>Market snapshot</h2>
<table>${rows.map((x) => `<tr><th>${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join("")}</table>
<h2>What affects the score</h2>
<ul>${r.n.map((x) => `<li>${x.b ? "⚠️" : "✓"} ${esc(x.t)}</li>`).join("")}</ul>
<div class="box">This page uses market data only. It cannot read the token's contract (hidden mint, taxes, ownership), so it can miss scams.
<a href="/">Run the full scan with the contract check on PairScope</a>. See <a href="/methodology">how the scores work</a>.</div>`;
  const res = page({ status: 200, title, desc, canonical: url, noindex: o.l < MIN_INDEX_LIQ, body });
  if (cache) context.waitUntil(cache.put(key, res.clone()));
  return res;
}
