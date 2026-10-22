// Sonde temporaire : structure HTML d'aelf.org (texte masqué) et disponibilité des fonds de carte.
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("probe-out", { recursive: true });
const mask = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "<script/>")
    .replace(/<style[\s\S]*?<\/style>/gi, "<style/>")
    .replace(/>([^<]+)</g, (_, t) => ">" + t.replace(/[A-Za-zÀ-ÿœŒ]/g, "x") + "<");
for (const [name, url] of [
  ["index", "https://www.aelf.org/bible"],
  ["mt5", "https://www.aelf.org/bible/Mt/5"],
  ["ps22", "https://www.aelf.org/bible/Ps/22"],
]) {
  const res = await fetch(url, { headers: { "user-agent": "bon-chemin-probe" } });
  const html = await res.text();
  console.log(name, res.status, html.length);
  writeFileSync(`probe-out/${name}.masked.html`, mask(html));
  if (name === "ps22") {
    // vérification de la numérotation : quelques mots du verset 1 dans le journal uniquement
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const i = text.search(/berger/i);
    console.log("PS22 contient « berger » :", i >= 0, i >= 0 ? text.slice(Math.max(0, i - 60), i + 20) : "");
  }
}
const tiles = {
  carto_light: "https://a.basemaps.cartocdn.com/light_all/7/76/52.png",
  carto_voyager: "https://a.basemaps.cartocdn.com/rastertiles/voyager/7/76/52.png",
  osm: "https://tile.openstreetmap.org/7/76/52.png",
  dare: "https://dh.gu.se/tiles/imperium/7/76/52.png",
  dare_alt: "https://imperium.ahlfeldt.se/tiles/7/76/52.png",
  awmc: "https://cawm.lib.uiowa.edu/tiles/7/76/52.png",
};
for (const [k, u] of Object.entries(tiles)) {
  try {
    const r = await fetch(u, { headers: { "user-agent": "bon-chemin-probe", referer: "https://nono-el-nino.github.io/" } });
    const b = await r.arrayBuffer();
    console.log("TILE", k, r.status, r.headers.get("content-type"), b.byteLength, r.headers.get("access-control-allow-origin"));
  } catch (e) {
    console.log("TILE", k, "ERR", e.message);
  }
}
