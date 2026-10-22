// Remplace chaque lien vers le Catéchisme par la page vatican.va qui contient
// le premier paragraphe cité. S'appuie sur scripts/data/cec-pages.json
// (produit par scripts/crawl-cec.mjs). Usage : node scripts/apply-cec-links.mjs
// Relancer le relevé : node scripts/crawl-cec.mjs (accès Internet nécessaire).
import { readFileSync, writeFileSync } from "node:fs";
import { cecPageFor } from "./cec-map.mjs";

const pages = JSON.parse(readFileSync("scripts/data/cec-pages.json", "utf8"));
const missing = [];
let changed = 0;

const fix = (t) => {
  if (t?.source !== "CEC") return;
  const url = cecPageFor(pages, t.paragraphs);
  if (!url) return missing.push(t.paragraphs);
  if (t.url !== url) changed++;
  t.url = url;
};

for (const f of ["passages.json", "parcours.json"]) {
  const path = `src/content/data/${f}`;
  const data = JSON.parse(readFileSync(path, "utf8"));
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      if (Array.isArray(v.teaching)) v.teaching.forEach(fix);
      Object.values(v).forEach(walk);
    }
  };
  walk(data);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
console.log(`${changed} liens mis à jour.`);
if (missing.length) {
  console.error("Paragraphes introuvables :", [...new Set(missing)].join(", "));
  process.exit(1);
}
