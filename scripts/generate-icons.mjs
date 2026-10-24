// Génère les icônes PNG à partir de public/icons/icon.svg (nécessite Playwright + Chromium).
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync("public/icons/icon.svg", "utf8");
const targets = [
  { file: "icon-192.png", size: 192, pad: 0 },
  { file: "icon-512.png", size: 512, pad: 0 },
  { file: "apple-touch-icon.png", size: 180, pad: 0, square: true },
  { file: "icon-maskable-512.png", size: 512, pad: 0.12, square: true },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  let s = svg;
  if (t.square) s = s.replace('rx="112"', 'rx="0"');
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<body style="margin:0;background:#EEF2F6;display:grid;place-items:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${s.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body>`,
  );
  await page.screenshot({ path: `public/icons/${t.file}`, omitBackground: !t.square });
  console.log("✓", t.file);
}
await browser.close();
