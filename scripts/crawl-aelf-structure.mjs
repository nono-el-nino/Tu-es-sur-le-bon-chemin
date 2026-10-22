// Relève la structure de la Bible AELF : livres, chapitres et nombre de versets par chapitre.
// Aucun texte biblique n'est conservé, seulement des comptages.
// Usage (accès Internet nécessaire) : node scripts/crawl-aelf-structure.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://www.aelf.org";
const get = async (path) => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(BASE + path, { headers: { "user-agent": "bon-chemin-structure" } });
      if (r.ok) return await r.text();
      console.log("HTTP", r.status, path);
    } catch (e) {
      console.log("ERR", path, e.message);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
};
const decode = (s) => s.replace(/&#039;|&rsquo;/g, "’").replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const index = await get("/bible");
// Livres dans l'ordre de l'index : <a href="/bible/Gn/1" title="Accéder à : Livre de la Genèse">
const books = [];
for (const m of index.matchAll(/href="\/bible\/([0-9A-Za-z]+)\/([0-9A-Za-z]+)"\s+title="Accéder à : ([^"]+)"/g)) {
  const [, code, first, title] = m;
  if (!books.some((b) => b.code === code)) books.push({ code, name: decode(title), first });
}
// Les psaumes sont listés un par un : title="Accéder au psaume 9B"
const psalms = [...new Set([...index.matchAll(/href="\/bible\/Ps\/([0-9A-Za-z]+)"\s+title="Accéder au psaume/g)].map((m) => m[1]))];
if (psalms.length && !books.some((b) => b.code === "Ps")) {
  const at = books.findIndex((b) => b.code === "Pr");
  books.splice(at < 0 ? books.length : at, 0, { code: "Ps", name: "Livre des Psaumes", first: psalms[0], ids: psalms });
}
console.log(books.length, "livres :", books.map((b) => b.code).join(" "), "| psaumes :", psalms.length);

const NT = new Set("Mt Mc Lc Jn Ac Rm 1Co 2Co Ga Ep Ph Col 1Th 2Th 1Tm 2Tm Tt Phm He Jc 1P 2P 1Jn 2Jn 3Jn Jude Ap".split(" "));
for (const b of books) {
  const first = await get(`/bible/${b.code}/${b.first}`);
  let ids = b.ids ?? [...new Set([...first.matchAll(new RegExp(`href="/bible/${b.code}/([0-9A-Za-z]+)"`, "g"))].map((m) => m[1]))];
  if (!ids.includes(b.first)) ids = [b.first, ...ids];
  b.testament = NT.has(b.code) ? "NT" : "AT";
  b.chapters = [];
  for (const id of ids) {
    const html = id === b.first ? first : await get(`/bible/${b.code}/${id}`);
    const verses = html ? new Set([...html.matchAll(/class="verse_number">\s*([^<\s]+)\s*</g)].map((m) => m[1])).size : null;
    b.chapters.push({ id, verses });
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(b.code, b.name, b.chapters.length, "chapitres", b.chapters.reduce((a, c) => a + (c.verses ?? 0), 0), "versets", "|", b.chapters.map((c) => c.id).join(","));
  delete b.first;
  delete b.ids;
}
mkdirSync("scripts/data", { recursive: true });
writeFileSync("scripts/data/aelf-structure.json", JSON.stringify({ source: "https://www.aelf.org/bible", retrievedAt: new Date().toISOString().slice(0, 10), books }, null, 1) + "\n");
