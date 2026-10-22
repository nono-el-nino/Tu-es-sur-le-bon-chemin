// Vérifie que tous les liens de source (aelf.org, vatican.va) répondent.
// À lancer depuis une machine ayant accès à Internet : npm run check-links
import { readFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../src/content/data/${f}`, import.meta.url)));
const urls = new Set();
const walk = (v) => {
  if (typeof v === "string" && /^https?:\/\//.test(v)) urls.add(v);
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") Object.values(v).forEach(walk);
};
["passages.json", "topics.json", "parcours.json", "sources.json", "places.json"].forEach((f) => walk(read(f)));

let failed = 0;
for (const url of [...urls].sort()) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "bon-chemin-link-check" } });
    const ok = res.status < 400;
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} ${res.status} ${url}`);
  } catch (e) {
    failed++;
    console.log(`✗ ERR ${url} (${e.cause?.code ?? e.message})`);
  }
}
console.log(`\n${urls.size} liens, ${failed} en échec.`);
console.log("Rappel : vérifier aussi à l'œil que chaque page affiche bien le bon chapitre (surtout les psaumes).");
process.exit(failed ? 1 : 0);
