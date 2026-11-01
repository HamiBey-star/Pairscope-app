Parked files (not loaded by the live site, kept so no work is lost)
- extras.js               back-to-top button, offline banner, install-app button. Was only loaded by an old backup of index.html.
- forensics.js            wallet/token forensics UI. Not referenced by any page.
- token-page-function.js  server-side rendered token page for search engines. It is a Cloudflare Pages Function in
                          spirit: to use it, copy it to functions/ (for example functions/t.js), export onRequestGet, and test first.
Nothing in this folder is published by update-and-pack (pack.mjs skips scripts/).
