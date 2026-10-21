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

## Before you deploy
- `og.jpg` (share image) must stay in the repo root; index.html points to https://pairscope.online/og.jpg
- Attach pairscope.online as a custom domain in Cloudflare
- Never commit Worker secrets; use `wrangler secret put`

## Still to do
- Remove `'unsafe-inline'` from `style-src` (about 80 inline style attributes remain)
