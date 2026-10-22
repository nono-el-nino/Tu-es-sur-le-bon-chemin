// Relève, page par page, les numéros de paragraphes du Catéchisme (version française)
// publiés sur vatican.va. Résultat : scripts/data/cec-pages.json
// Usage (machine avec accès Internet) : node scripts/crawl-cec.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const START = "https://www.vatican.va/archive/ccc/index_fr.htm";
const MAX = 1500;
const seen = new Set();
const queue = [START];
const pages = [];

const decode = (buf) => {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("latin1").decode(buf) : utf8;
};

// Uniquement le Catéchisme en français : la page d'index et le dossier /archive/FRA0013/.
const allowed = (u) =>
  /(^|\.)vatican\.va$/.test(u.hostname) && (/^\/archive\/FRA0013\//i.test(u.pathname) || /^\/archive\/ccc\/index_fr\.htm$/i.test(u.pathname)) && /\.html?$/i.test(u.pathname);

while (queue.length && seen.size < MAX) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  let html;
  try {
    const res = await fetch(url, { headers: { "user-agent": "bon-chemin-cec-index" } });
    if (!res.ok) {
      if (seen.size < 30) console.log("HTTP", res.status, url);
      continue;
    }
    html = decode(new Uint8Array(await res.arrayBuffer()));
  } catch (e) {
    console.log("ERR", url, e.message);
    continue;
  }
  const base = html.match(/<base\s+href\s*=\s*"?([^"\s>]+)/i)?.[1];
  for (const m of html.matchAll(/href\s*=\s*"?([^"\s>]+)"?/gi)) {
    try {
      const u = new URL(m[1], base ? new URL(base, url) : url);
      u.protocol = "https:";
      u.hostname = "www.vatican.va";
      u.hash = "";
      if (allowed(u) && !seen.has(u.href)) queue.push(u.href);
    } catch {}
  }
  if (process.env.SAVE_RAW) {
    mkdirSync("raw", { recursive: true });
    writeFileSync(`raw/${new URL(url).pathname.split("/").pop()}`, html);
  }
  pages.push({ url, html });
  await new Promise((r) => setTimeout(r, 60));
}

// Les paragraphes sont publiés dans les pages __P*.HTM, au format « <p>1716 Les béatitudes… ».
const parsed = [];
for (const { url, html } of pages) {
  if (!/\/__P[^/]*\.HTM$/i.test(url)) continue;
  const nums = [...html.matchAll(/<p[^>]*>\s*(?:<[^>]+>\s*)*(\d{1,4})(?=\s|<|&)/gi)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 2865);
  if (!nums.length) continue;
  const text = html.replace(/<head[\s\S]*?<\/head>/i, "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
  const firstHit = (n) => text.search(new RegExp(`(^|[^\\d])${n}([^\\d]|$)`));
  const paraHit = (n) => text.search(new RegExp(`(^|[^\\d])${n}\\s+\\S`));
  parsed.push({ url, first: nums[0], last: nums[nums.length - 1], textFragmentUnsafe: nums.filter((n) => firstHit(n) < paraHit(n)) });
}
parsed.sort((a, b) => a.first - b.first);
const covered = parsed.reduce((acc, p) => acc + p.last - p.first + 1, 0);
console.log(`${pages.length} pages lues, ${parsed.length} pages de paragraphes, ${covered} paragraphes couverts.`);
mkdirSync("scripts/data", { recursive: true });
writeFileSync("scripts/data/cec-pages.json", JSON.stringify(parsed, null, 1) + "\n");
