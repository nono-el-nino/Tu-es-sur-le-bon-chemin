// Relève, page par page, les numéros de paragraphes du Catéchisme (version française)
// publiés sur vatican.va. Résultat : scripts/data/cec-pages.json
// Usage (machine avec accès Internet) : node scripts/crawl-cec.mjs
import { writeFileSync } from "node:fs";

const START = "https://www.vatican.va/archive/ccc/index_fr.htm";
const MAX = 1500;
const seen = new Set();
const queue = [START];
const pages = [];

const decode = (buf) => {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("latin1").decode(buf) : utf8;
};

const allowed = (u) =>
  u.hostname === "www.vatican.va" && /^\/archive\//i.test(u.pathname) && /\.html?$/i.test(u.pathname) && /(FRA|ccc)/i.test(u.pathname);

while (queue.length && seen.size < MAX) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  let html;
  try {
    const res = await fetch(url, { headers: { "user-agent": "bon-chemin-cec-index" } });
    if (!res.ok) {
      console.log("HTTP", res.status, url);
      continue;
    }
    html = decode(new Uint8Array(await res.arrayBuffer()));
  } catch (e) {
    console.log("ERR", url, e.message);
    continue;
  }
  for (const m of html.matchAll(/href\s*=\s*"?([^"\s>]+)"?/gi)) {
    try {
      const u = new URL(m[1], url);
      u.hash = "";
      if (allowed(u) && !seen.has(u.href)) queue.push(u.href);
    } catch {}
  }
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  // Numéros de paragraphes : en gras en début de paragraphe (« <b>1716</b> »).
  const nums = [...html.matchAll(/<b>\s*(?:<[^>]+>\s*)*(\d{1,4})\s*(?:<\/[^>]+>\s*)*<\/b>/gi)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 2865);
  const anchors = [...html.matchAll(/<a\s+name\s*=\s*"?([^"\s>]+)"?/gi)].map((m) => m[1]).slice(0, 40);
  pages.push({ url, title, nums: [...new Set(nums)], anchors });
  if (pages.length <= 3 || (nums.length === 0 && pages.length < 15)) {
    console.log("---", url, "|", title, "| nums:", nums.length, "| anchors:", anchors.slice(0, 8).join(","));
    console.log(html.replace(/\s+/g, " ").slice(0, 1200));
  }
  await new Promise((r) => setTimeout(r, 120));
}

const withNums = pages.filter((p) => p.nums.length > 0);
const covered = new Set(withNums.flatMap((p) => p.nums));
console.log(`\n${pages.length} pages lues, ${withNums.length} avec paragraphes, ${covered.size} numéros distincts couverts.`);
const sample = withNums.slice(0, 5).map((p) => `${p.url} ${Math.min(...p.nums)}-${Math.max(...p.nums)} anchors:${p.anchors.slice(0, 5)}`);
console.log(sample.join("\n"));
writeFileSync("scripts/data/cec-pages.json", JSON.stringify(withNums.map(({ url, title, nums, anchors }) => ({ url, title, nums, anchors })), null, 1));
