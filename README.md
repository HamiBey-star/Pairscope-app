# PairScope

Live DEX pair scanner with Heat scores, a Risk Radar and a contract security checker.
Not financial advice.

## Structure
- `index.html` markup only (no inline scripts, so the CSP can block injected scripts)
- `css/styles.css` all styles
- `js/` scripts, loaded in the order listed in `index.html` (order matters: they share globals)
- `_headers` Cloudflare security headers (kept separate from the meta CSP in index.html)

## Before you deploy
- Add `og.png` (1200x630) to the repo root, since index.html now points to https://pairscope.online/og.png
- Attach pairscope.online as a custom domain in Cloudflare
- Never commit Worker secrets; use `wrangler secret put`

## Still to do
- Remove `'unsafe-inline'` from `style-src` (about 80 inline style attributes remain)
