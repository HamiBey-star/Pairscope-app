/* Builds pairscope-upload.zip: the live site only, files at the top level (what Cloudflare Pages expects).
   No dependencies. Leaves out scripts, .github, launchers, old zips and README. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "pairscope-upload.zip");
const SKIP_DIRS = new Set([".git", ".github", "scripts", "node_modules"]);
const SKIP_FILES = /(\.zip|\.bat|\.command|\.sh)$|^(README\.md|START-HERE\.txt|\.DS_Store|Thumbs\.db)$/;

const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function walk(dir, rel = "") {
  let out = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + "/" + d.name : d.name;
    if (d.isDirectory()) { if (!SKIP_DIRS.has(d.name)) out = out.concat(walk(path.join(dir, d.name), r)); }
    else if (d.isFile() && !SKIP_FILES.test(d.name)) out.push(r);
  }
  return out;
}

const now = new Date();
const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
const files = walk(ROOT).sort();
if (!files.includes("index.html")) { console.error("index.html not found. Run this from the site folder."); process.exit(1); }

const parts = [], central = []; let offset = 0;
for (const rel of files) {
  const raw = fs.readFileSync(path.join(ROOT, rel)), name = Buffer.from(rel, "utf8"), crc = crc32(raw);
  let data = zlib.deflateRawSync(raw, { level: 9 }), method = 8;
  if (data.length >= raw.length) { data = raw; method = 0; }
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(dosTime, 10); lh.writeUInt16LE(dosDate, 12); lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
  parts.push(lh, name, data);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(dosTime, 12); ch.writeUInt16LE(dosDate, 14); ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28);
  ch.writeUInt32LE(offset, 42);
  central.push(ch, name);
  offset += 30 + name.length + data.length;
}
const cd = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
fs.writeFileSync(OUT, Buffer.concat([...parts, cd, end]));
console.log(`Created pairscope-upload.zip (${files.length} files, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB). Upload this file to your site.`);
