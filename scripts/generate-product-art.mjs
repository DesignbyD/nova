// Generates original product illustrations (JPG) into public/products and public/art.
// Run with: npm run art   (requires the dev dependency "sharp")
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(path.join(root, "data/catalog.json"), "utf8"));

/* Each drawer paints one object in a 800x1000 box. The ground line sits at y=800. */
const shadow = (cx = 400, rx = 190, y = 806) =>
  `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="18" fill="#10131c" opacity="0.28" filter="url(#soft)"/>`;

const objects = {
  "halo-table-lamp": () => `
    ${shadow(400, 150)}
    <circle cx="400" cy="340" r="215" fill="#FFE3A3" opacity="0.38" filter="url(#glow)"/>
    <rect x="392" y="470" width="16" height="190" fill="#3A3F4E"/>
    <path d="M300 800 L300 700 Q300 650 350 650 L450 650 Q500 650 500 700 L500 800 Z" fill="#CFC8BB"/>
    <path d="M300 800 L300 700 Q300 650 350 650 L372 650 L372 800 Z" fill="#fff" opacity="0.28"/>
    <circle cx="400" cy="340" r="140" fill="none" stroke="#FBF3DC" stroke-width="30"/>
    <circle cx="400" cy="340" r="140" fill="none" stroke="#fff" stroke-width="9" opacity="0.8"/>`,
  "dusk-reading-light": () => `
    ${shadow(400, 150)}
    <path d="M400 790 L400 600 Q400 390 590 372" fill="none" stroke="#2E3342" stroke-width="16" stroke-linecap="round"/>
    <ellipse cx="400" cy="790" rx="120" ry="20" fill="#2E3342"/>
    <ellipse cx="400" cy="784" rx="120" ry="20" fill="#454C60"/>
    <path d="M520 340 L670 340 L710 440 L480 440 Z" fill="#D6CDBB"/>
    <path d="M520 340 L560 340 L540 440 L480 440 Z" fill="#fff" opacity="0.3"/>
    <ellipse cx="595" cy="440" rx="115" ry="12" fill="#FFE3A3"/>
    <path d="M500 452 L690 452 L760 760 L430 760 Z" fill="#FFE3A3" opacity="0.14"/>`,
  "tide-carafe": () => `
    ${shadow(400, 150)}
    <path d="M356 300 L444 300 L444 385 C444 440 524 470 524 590 L524 760 Q524 800 484 800 L316 800 Q276 800 276 760 L276 590 C276 470 356 440 356 385 Z" fill="#A9D3CD" opacity="0.62" stroke="#7FB5AE" stroke-width="4"/>
    <path d="M276 640 L524 640 L524 760 Q524 800 484 800 L316 800 Q276 800 276 760 Z" fill="#7FB5AE" opacity="0.5"/>
    <path d="M310 520 Q304 600 308 740" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
    <rect x="368" y="262" width="64" height="44" rx="14" fill="#C8E4DF" stroke="#7FB5AE" stroke-width="4"/>`,
  "stoneware-cup-pair": () => {
    const cup = (x, tone, rim) => `
      <path d="M${x} 590 L${x + 210} 590 L${x + 192} 770 Q${x + 188} 800 ${x + 158} 800 L${x + 52} 800 Q${x + 22} 800 ${x + 18} 770 Z" fill="${tone}"/>
      <path d="M${x} 590 L${x + 40} 590 L${x + 52} 800 L${x + 22} 800 Q${x + 18} 800 ${x + 18} 770 Z" fill="#fff" opacity="0.25"/>
      <ellipse cx="${x + 105}" cy="590" rx="105" ry="20" fill="${rim}"/>
      <ellipse cx="${x + 105}" cy="594" rx="88" ry="14" fill="#8B877D"/>
      <circle cx="${x + 70}" cy="690" r="2.5" fill="#6E6A60"/><circle cx="${x + 140}" cy="730" r="2.2" fill="#6E6A60"/><circle cx="${x + 120}" cy="660" r="2" fill="#6E6A60"/>`;
    return `${shadow(400, 260)}${cup(150, "#D6D1C6", "#E4E0D6")}${cup(430, "#CAC4B7", "#DAD6CC")}`;
  },
  "ash-low-bowl": () => `
    ${shadow(400, 240)}
    <path d="M170 650 L630 650 Q620 800 400 800 Q180 800 170 650 Z" fill="#D9D8D1"/>
    <path d="M170 650 L250 650 Q250 770 330 796 Q190 790 170 650 Z" fill="#fff" opacity="0.3"/>
    <ellipse cx="400" cy="650" rx="230" ry="42" fill="#E8E7E1"/>
    <ellipse cx="400" cy="656" rx="200" ry="30" fill="#BDBCB3"/>`,
  "field-notebook": () => `
    ${shadow(400, 170)}
    <rect x="262" y="360" width="276" height="436" rx="12" fill="#2F3A4A"/>
    <rect x="262" y="360" width="30" height="436" rx="12" fill="#fff" opacity="0.1"/>
    <rect x="272" y="786" width="256" height="10" rx="3" fill="#EDE8DD"/>
    <rect x="478" y="360" width="14" height="436" fill="#C7B393"/>
    <path d="M400 440 C404 466 418 480 444 484 C418 488 404 502 400 528 C396 502 382 488 356 484 C382 480 396 466 400 440Z" fill="#fff" opacity="0.5"/>`,
  "slate-desk-tray": () => `
    ${shadow(400, 270)}
    <polygon points="200,640 600,640 660,722 140,722" fill="#59606B"/>
    <polygon points="225,655 575,655 622,712 178,712" fill="#474D57"/>
    <rect x="140" y="722" width="520" height="72" rx="8" fill="#363B43"/>
    <rect x="140" y="722" width="520" height="14" fill="#fff" opacity="0.07"/>`,
  "brass-pen": () => `
    ${shadow(400, 250, 790)}
    <g transform="rotate(-32 400 560)">
      <rect x="110" y="540" width="500" height="40" rx="20" fill="#B88F3B"/>
      <rect x="110" y="540" width="500" height="13" rx="6" fill="#E3C679" opacity="0.8"/>
      <path d="M610 540 L700 560 L610 580 Z" fill="#8E6F2A"/>
      <rect x="690" y="556" width="30" height="8" rx="4" fill="#2A2D36"/>
      <rect x="150" y="522" width="190" height="10" rx="5" fill="#8E6F2A"/>
    </g>`,
  "pebble-desk-weight": () => `
    ${shadow(400, 210, 806)}
    <path d="M215 720 C205 620 300 560 420 566 C540 572 610 640 590 730 C575 790 480 806 390 804 C290 802 222 780 215 720 Z" fill="#8F988F"/>
    <path d="M250 690 C260 628 330 596 410 598 C350 620 300 650 290 720 Z" fill="#fff" opacity="0.3"/>
    <ellipse cx="500" cy="760" rx="70" ry="18" fill="#000" opacity="0.1"/>`,
  "daily-tote-sand": () => `
    ${shadow(400, 220)}
    <path d="M310 440 C310 230 490 230 490 440" fill="none" stroke="#8A6B45" stroke-width="20" stroke-linecap="round"/>
    <path d="M232 440 L568 440 L592 794 Q592 800 586 800 L214 800 Q208 800 208 794 Z" fill="#DBCBA9"/>
    <path d="M232 440 L300 440 L282 800 L214 800 Q208 800 208 794 Z" fill="#fff" opacity="0.22"/>
    <rect x="232" y="440" width="336" height="44" fill="#CDBA95"/>
    <rect x="300" y="590" width="200" height="130" rx="8" fill="none" stroke="#B9A57E" stroke-width="4"/>`,
  "pocket-pouch": () => `
    ${shadow(400, 170)}
    <rect x="258" y="540" width="284" height="258" rx="46" fill="#5E6E50"/>
    <rect x="258" y="540" width="40" height="258" rx="30" fill="#fff" opacity="0.12"/>
    <path d="M280 584 L520 584" stroke="#2F3A28" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 10"/>
    <rect x="500" y="570" width="34" height="48" rx="12" fill="#C9B79C"/>`,
  "everyday-card-holder": () => `
    ${shadow(400, 190)}
    <rect x="320" y="440" width="190" height="130" rx="10" fill="#FFFFFF"/>
    <rect x="340" y="458" width="70" height="10" rx="3" fill="#C9CDD6"/>
    <rect x="232" y="500" width="336" height="296" rx="26" fill="#B98B5E"/>
    <rect x="232" y="500" width="40" height="296" rx="20" fill="#fff" opacity="0.16"/>
    <rect x="252" y="520" width="296" height="256" rx="16" fill="none" stroke="#E2C7A1" stroke-width="3" stroke-dasharray="9 8"/>`,
};

const defs = `<defs>
  <filter id="soft" x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
</defs>`;

const star = (x, y, s, fill, op = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M12 0C12.7 7.3 16.7 11.3 24 12C16.7 12.7 12.7 16.7 12 24C11.3 16.7 7.3 12.7 0 12C7.3 11.3 11.3 7.3 12 0Z" fill="${fill}" opacity="${op}"/>`;

const grounds = {
  lighting: { a: "#E7E2DA", b: "#2A2F55", bName: "deep indigo", c: "#EFEAE2" },
  tableware: { a: "#DDE3DE", b: "#2F4A40", bName: "deep green", c: "#E6EBE7" },
  desk: { a: "#E3E3E0", b: "#2B3140", bName: "dark slate", c: "#ECECEA" },
  carry: { a: "#E5E1DC", b: "#8FA3B8", bName: "dusty blue", c: "#EDEAE5" },
};

const baseScale = {
  "halo-table-lamp": 1.05, "dusk-reading-light": 1.0, "tide-carafe": 1.1, "stoneware-cup-pair": 1.1,
  "ash-low-bowl": 1.12, "field-notebook": 1.15, "slate-desk-tray": 1.12, "brass-pen": 1.2,
  "pebble-desk-weight": 1.3, "daily-tote-sand": 1.1, "pocket-pouch": 1.25, "everyday-card-holder": 1.25,
};

function productSvg(slug, category, view) {
  const g = grounds[category];
  const draw = objects[slug]();
  const dark = view === 2;
  const bg = view === 1 ? g.a : view === 2 ? g.b : g.c;
  const k = baseScale[slug] ?? 1;
  const transform =
    view === 1
      ? `transform="translate(400 800) scale(${k}) translate(-400 -800)"`
      : view === 2
        ? `transform="translate(400 760) scale(${(k * 1.18).toFixed(3)}) translate(-400 -760)"`
        : `transform="translate(300 800) scale(${(k * 0.72).toFixed(3)}) translate(-400 -800)"`;
  const floor = dark ? "#000" : "#fff";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">${defs}
    <rect width="800" height="1000" fill="${bg}"/>
    <rect y="800" width="800" height="200" fill="${floor}" opacity="${dark ? 0.16 : 0.32}"/>
    ${star(640, 120, 2.2, dark ? "#fff" : "#4A2FE0", dark ? 0.35 : 0.2)}
    <g ${transform}>${draw}</g>
  </svg>`;
}

const out = path.join(root, "public/products");
await mkdir(out, { recursive: true });
await mkdir(path.join(root, "public/art"), { recursive: true });

const toJpg = (svg, w, h, file) =>
  sharp(Buffer.from(svg), { density: 144 }).resize(w, h).jpeg({ quality: 82, mozjpeg: true }).toFile(file);

for (const p of catalog.products) {
  for (const view of [1, 2, 3]) {
    await toJpg(productSvg(p.slug, p.category, view), 1000, 1250, path.join(out, `${p.slug}-${view}.jpg`));
  }
}

/* Hero: a composed still life */
const place = (slug, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-400 -800)">${objects[slug]()}</g>`;
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500">${defs}
  <rect width="1200" height="1500" fill="#E4E8E3"/>
  <circle cx="560" cy="720" r="470" fill="#E8E4FC"/>
  <rect y="1250" width="1200" height="250" fill="#fff" opacity="0.4"/>
  ${star(930, 170, 3.4, "#4A2FE0", 0.9)}
  ${place("halo-table-lamp", 470, 1270, 1.45)}
  ${place("tide-carafe", 900, 1290, 0.95)}
  ${place("stoneware-cup-pair", 760, 1320, 0.55)}
  ${place("field-notebook", 160, 1320, 0.7)}
</svg>`;
await toJpg(hero, 1200, 1500, path.join(root, "public/art/hero.jpg"));

/* Editorial: a desk scene, landscape */
const editorial = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">${defs}
  <rect width="1600" height="1000" fill="#2B3140"/>
  <rect y="760" width="1600" height="240" fill="#000" opacity="0.18"/>
  ${star(1360, 150, 3, "#fff", 0.35)}
  ${place("slate-desk-tray", 620, 820, 1.25)}
  ${place("field-notebook", 1080, 830, 1.05)}
  ${place("pebble-desk-weight", 280, 830, 0.8)}
  ${place("brass-pen", 880, 800, 0.62)}
</svg>`;
await toJpg(editorial, 1600, 1000, path.join(root, "public/art/editorial.jpg"));

/* Portrait wide crop for the about page */
await writeFile(path.join(root, "public/art/.generated"), "Generated by scripts/generate-product-art.mjs\n");
console.log(`Generated ${catalog.products.length * 3} product images and 2 scene images.`);
