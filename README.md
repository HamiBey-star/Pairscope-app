# PairScope

Live DEX pair scanner with Heat scores, a Risk Radar and a contract security checker.
Not financial advice.

## Structure
- `index.html` markup only (no inline scripts, so the CSP can block injected scripts)
- `css/styles.css` all styles
- `js/` scripts, loaded in the order listed in `index.html` (order matters: they share globals)
- `_headers` Cloudflare security headers (kept separate from the meta CSP in index.html)

## UI notes
- `js/icons.js` is the single icon set (`PSI(name,size)`). Loaded before `core.js`. Icons use `pointer-events:none` so tab clicks still hit the button.
- `js/hot-cards.js` thresholds: `MIN_SCANS`, `MIN_HEAT`, `RUG` at the top of the file.

- $PSP share link is `/psp` (`psp.html`, card image `og-psp.jpg`). If you change the coin address, edit it in BOTH `js/psp.js` and `psp.html`.

- Token share links are `/s?scan=<address>&c=<chain>` and `/s?c=<chain>&a=<address>`. `functions/s.js` (Cloudflare Pages Function) gives link-preview bots a token-specific card (name, price, 24h, liquidity, token icon from DexScreener) and sends everyone else straight to the app. `_routes.json` makes sure only `/s` runs the function. Needs a Git-connected Pages deploy (a plain drag-and-drop upload ignores `functions/`).

- Share card (`share()` in `js/tools.js`) draws the coin picture. It loads it through `functions/img.js` (/img, DexScreener hosts only) so the browser can export the image, with a letter avatar as fallback.
- Cache busting: `index.html` loads css/js with `?v=20261021b`. Change that value (search and replace) whenever you redeploy so phones don't keep old files.

## Before you deploy
- `og.jpg` (share image) must stay in the repo root; index.html points to https://pairscope.online/og.jpg
- Attach pairscope.online as a custom domain in Cloudflare
- Never commit Worker secrets; use `wrangler secret put`

## Still to do
- Remove `'unsafe-inline'` from `style-src` (about 80 inline style attributes remain)

## Track record page
- `track-record.html` + `js/track-record.js` + `css/track.css` render `data/track-record.json`.
- Add one object per flagged token to `entries`, then set `updated` to today's date (YYYY-MM-DD). Never delete entries; add a `n` note to correct one.
- Fields: `s` symbol, `c` chain (e.g. solana), `a` token address, `d` date flagged, `rs` Risk score when flagged, `why` short reason, `o` outcome (`pending`, `rugged`, `down50`, `mixed`, `up`), `oc` date checked, `n` optional note.
- Example: `{"s":"EXAMPLE","c":"solana","a":"<address>","d":"2026-10-26","rs":42,"why":"Liquidity under $5K, 90% of trades are buys","o":"pending"}`

### Automatic updates (GitHub Actions)
- `scripts/track.mjs` flags up to 5 new Solana pairs a day (liquidity >= $10K, Risk < 50) and judges entries after 7 days. Its `riskCalc` is a port of `riskCalc()` in `js/core.js`; if you change one, change the other.
- `.github/workflows/track-record.yml` runs it daily at 06:15 UTC and commits `data/track-record.json`. It needs the site to be a Git repo with a Git-connected Cloudflare Pages deploy so each commit redeploys. Run it by hand from the Actions tab (workflow_dispatch) to test.
- The `scripts/` and `.github/` folders are not needed on the live site. A plain zip upload will publish them, which is harmless (no secrets in them).

## Forensics and paper-trading module
- `js/forensics.js` adds a market-signal panel and browser-local paper portfolio without replacing the existing scanner, contract checks, alerts, or Featured workflow.
- Market alerts cover new-pair age, thin liquidity, volume/liquidity anomalies, buy/sell imbalance, extreme short-term price movement, and observed liquidity/volume changes between refreshes.
- Solana holder concentration uses public Solana JSON-RPC largest-token-account data and groups readable token-account owners. It is a partial estimate, not a complete holder census; public RPC may rate-limit requests.
- Paper trades are simulations stored in the current browser's local storage. Entry/exit estimates include user-configurable fee and slippage assumptions. They are not executable quotes or a backtest and do not prove a strategy is profitable.
- **Not yet available from the existing DexScreener feed:** launch-bundle detection, reliable developer-wallet identification/sell monitoring, and full early-holder concentration across all chains. Those require transaction-level chain indexing plus a provider/backend, creator-wallet attribution, and persistent event history. The interface explicitly labels these as unavailable instead of fabricating a result.
