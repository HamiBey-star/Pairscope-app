/* PairScope track record bot. Runs daily (see .github/workflows/track-record.yml).
   1) Flags up to MAX_NEW new Solana pairs: liquidity >= MIN_LIQ and Risk score < 50, first ones in the "latest profiles" feed.
   2) Re-checks entries that have been pending for 7+ days and records ONE outcome using fixed rules.
   The Risk score is a port of riskCalc() in js/core.js. Keep them in sync. Entries are never deleted. */
import fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";

export const B = "https://api.dexscreener.com";
export const FILE = fileURLToPath(new URL("../data/track-record.json", import.meta.url));
export const MAX_NEW = 5, MIN_LIQ = 10000, FLAG_BELOW = 50, DAYS = 7;

export function mapPair(x, now) {
  const tx = (x.txns && x.txns.h24) || {}, pcg = x.priceChange || {};
  return { s: x.baseToken.symbol, c: x.chainId, addr: x.baseToken.address, pair: x.pairAddress,
    p: +x.priceUsd || 0, h1: pcg.h1 || 0, h24: pcg.h24 || 0,
    v: (x.volume && x.volume.h24) || 0, l: (x.liquidity && x.liquidity.usd) || 0, f: x.fdv || 0,
    t: x.pairCreatedAt || 0, b: tx.buys || 0, sl: tx.sells || 0, tx: (tx.buys || 0) + (tx.sells || 0), now };
}
const fm = (n) => { n = +n || 0; return n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "K" : "$" + Math.round(n); };

/* port of riskCalc(): same weights as the site */
export function riskCalc(o) {
  let s = 100; const bad = [];
  const b = (p, t) => { s -= p; bad.push(t); };
  if (!o.t) b(8, "Pair age unknown");
  else { const hrs = (o.now - o.t) / 36e5;
    if (hrs < 1) b(25, "Launched under 1 hour ago");
    else if (hrs < 24) b(15, "Less than 24 hours old");
    else if (hrs < 168) b(6, "Less than a week old"); }
  if (o.l < 5000) b(35, "Very low liquidity (" + fm(o.l) + ")");
  else if (o.l < 20000) b(25, "Low liquidity (" + fm(o.l) + ")");
  else if (o.l < 50000) b(12, "Below-average liquidity (" + fm(o.l) + ")");
  else if (o.l < 100000) b(5, "Moderate liquidity (" + fm(o.l) + ")");
  if (o.f > 0) { const lf = o.l / o.f;
    if (lf < 0.01) b(12, "Liquidity under 1% of valuation");
    else if (lf < 0.03) b(6, "Thin liquidity versus valuation"); }
  if (o.l > 0 && o.v / o.l > 20) b(10, "Volume " + Math.round(o.v / o.l) + "x liquidity");
  if (o.sl === 0 && o.b >= 30) b(20, "Many buys, zero sells (possible honeypot)");
  else if (o.tx >= 50 && o.sl > o.b * 1.5) b(10, "Sellers heavily outnumber buyers");
  if (o.tx < 50) b(10, "Very few trades (under 50 in 24h)");
  if (Math.abs(o.h24) > 200) b(12, "Price moved over 200% in 24h");
  else if (Math.abs(o.h1) > 50) b(8, "Price moved over 50% in the last hour");
  return { s: Math.max(0, Math.min(100, s)), bad };
}

/* fixed outcome rules (match track-record.html) */
export function judge(e, pairs) {
  const best = (pairs || []).filter((x) => x.priceUsd).sort((a, c) => ((c.liquidity && c.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0))[0];
  if (!best) return null;                          // no data: stay pending, never guess
  const p = +best.priceUsd || 0, l = (best.liquidity && best.liquidity.usd) || 0;
  if (!(p > 0) || !(e.p0 > 0)) return null;
  const ratio = p / e.p0;
  if ((e.l0 > 0 && l < e.l0 * 0.05) || (ratio <= 0.1 && l < 1000)) return "rugged";
  if (ratio <= 0.5) return "down50";
  if (ratio > 1) return "up";
  return "mixed";
}

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + " " + r.status); return r.json(); }

export async function run(data, now = Date.now(), get = j) {
  const entries = data.entries || [], today = ymd(now);
  /* 1) outcomes */
  for (const e of entries) {
    if (e.o !== "pending" || !e.a || !(e.p0 > 0)) continue;
    if (now - Date.parse(e.d + "T00:00:00Z") < DAYS * 864e5) continue;
    let pairs; try { pairs = await get(`${B}/tokens/v1/${encodeURIComponent(e.c)}/${encodeURIComponent(e.a)}`); } catch { continue; }
    const o = judge(e, Array.isArray(pairs) ? pairs : []);
    if (o) { e.o = o; e.oc = today; }
  }
  /* 2) new flags */
  const have = new Set(entries.map((e) => e.c + "|" + e.a));
  const profiles = (await get(B + "/token-profiles/latest/v1")).filter((t) => t.chainId === "solana").slice(0, 60);
  const addrs = [...new Set(profiles.map((t) => t.tokenAddress))];
  let added = 0;
  for (let i = 0; i < addrs.length && added < MAX_NEW; i += 30) {
    const list = await get(`${B}/tokens/v1/solana/${addrs.slice(i, i + 30).join(",")}`);
    const by = {};
    for (const x of Array.isArray(list) ? list : []) { const o = mapPair(x, now); if (!(o.p > 0)) continue;
      if (!by[o.addr] || o.l > by[o.addr].l) by[o.addr] = o; }
    for (const a of addrs.slice(i, i + 30)) {
      const o = by[a]; if (!o || added >= MAX_NEW || have.has("solana|" + a)) continue;
      if (o.l < MIN_LIQ) continue;
      const r = riskCalc(o); if (r.s >= FLAG_BELOW) continue;
      entries.push({ s: String(o.s).slice(0, 24), c: "solana", a, d: today, rs: r.s, why: r.bad.slice(0, 3).join("; ").slice(0, 240), o: "pending", p0: o.p, l0: Math.round(o.l) });
      have.add("solana|" + a); added++;
    }
  }
  data.entries = entries; data.updated = today; return { added, data };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (parseInt(process.versions.node, 10) < 18) { console.error("Please install Node.js 18 or newer from https://nodejs.org"); process.exit(1); }
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const { added, data: out } = await run(data);
    fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + "\n");
    const pend = out.entries.filter((e) => e.o === "pending").length;
    console.log(`Done. Added ${added} new flagged token(s). ${out.entries.length} total, ${pend} still pending.`);
  } catch (err) {
    console.error("Update failed, nothing was changed. Check your internet connection and try again.\n" + err.message);
    process.exit(1);
  }
}
