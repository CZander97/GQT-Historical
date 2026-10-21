// Prepares every image the site shows, from the raw folders in the project root:
//   Event Images/  -> public/media/events/  (WebP stills; GIFs become muted MP4 loops + a poster)
//   Player Images/ -> public/media/players/
//   Playercards/   -> public/media/cards/   (frame, card back, star)
//   GQT2026Logo.png -> public/media/logo-*.webp
// and writes src/media.json (the background rotation: name, file, size, tint).
//
//   node scripts/media.mjs
//
// Re-run it whenever images are added or replaced. Raw files are never modified.
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const pub = path.resolve(here, "../public/media");
const manifestFile = path.resolve(here, "../src/media.json");
const dataFile = path.resolve(here, "../src/data.json");

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const kb = (f) => Math.round(fs.statSync(f).size / 1024);

// Display names for files whose names don't read well with underscores swapped for spaces.
const NAME_OVERRIDES = {
  "cod-kills": "CoD Kills",
  "spiderman-2": "Spider-Man 2",
  "super-mario-strikers-cover": "Super Mario Strikers",
  "beyblade-v-force": "Beyblade V-Force",
  "atv-offroad-fury-2": "ATV Offroad Fury",
};

// ---------- tint: the image's strongest color, darkened into a backdrop wash ----------

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function tintOf(input) {
  const { data } = await sharp(input, { animated: false }).resize(32, 32, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = Array.from({ length: 12 }, () => ({ w: 0, h: 0, s: 0 }));
  let total = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const w = s * (1 - Math.abs(l - 0.5) * 2);          // vivid mid-tones count most
    const b = buckets[Math.floor(h / 30) % 12];
    b.w += w; b.h += h * w; b.s += s * w; total += w;
  }
  const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
  if (total < 20 || best.w < 4) return "#1c2742";        // greyscale image: brand navy
  let hue = best.h / best.w;
  if (hue >= 48 && hue <= 78) hue = 38;                   // dark yellow reads as olive; push it to amber
  const sat = Math.max(0.45, Math.min(0.75, (best.s / best.w) * 1.35));   // rich like Madden's team colors
  return hslToHex(hue, sat, 0.2);
}

// ---------- processing ----------

async function webp(input, output, longSide, quality = 80, extra = {}) {
  await sharp(input, { animated: false })
    .resize({ width: longSide, height: longSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality, ...extra })
    .toFile(output);
  return sharp(output).metadata();
}

function gifToMp4(input, output) {
  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error", "-i", input, "-an",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=24",
    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    output,
  ]);
}

async function events(statSlugs) {
  const dir = path.join(root, "Event Images");
  const outDir = path.join(pub, "events");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // group files by event; prefer an animated GIF, then the larger image
  const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f));
  const byEvent = new Map();
  for (const f of files) {
    const s = slug(path.parse(f).name);
    const meta = await sharp(path.join(dir, f), { animated: true }).metadata();
    const cand = { f, s, gif: /\.gif$/i.test(f) && (meta.pages || 1) > 1, area: meta.width * (meta.pageHeight || meta.height) };
    const prev = byEvent.get(s);
    if (!prev || (cand.gif && !prev.gif) || (cand.gif === prev.gif && cand.area > prev.area)) byEvent.set(s, cand);
  }
  // "40 Yard Dash.jpg" and "40_Yard_Dash.gif" share a slug already; this keeps one per event.

  const out = [];
  for (const { f, s, gif } of byEvent.values()) {
    const input = path.join(dir, f);
    const name = NAME_OVERRIDES[s] || path.parse(f).name.replace(/_/g, " ").trim();
    const statSlug = statSlugs.find((x) => s === x || s.startsWith(x + "-"));
    const poster = path.join(outDir, `${s}.webp`);
    const meta = await webp(input, poster, 1600, 80);
    const item = { slug: s, name, poster: `media/events/${s}.webp`, w: meta.width, h: meta.height, tint: await tintOf(input), event: statSlug || null };
    if (gif) {
      const mp4 = path.join(outDir, `${s}.mp4`);
      gifToMp4(input, mp4);
      item.video = `media/events/${s}.mp4`;
      console.log(`  ${f} (${kb(input)} KB gif) -> ${s}.mp4 ${kb(mp4)} KB + poster ${kb(poster)} KB`);
    } else {
      console.log(`  ${f} (${kb(input)} KB) -> ${s}.webp ${kb(poster)} KB  ${meta.width}x${meta.height}`);
    }
    out.push(item);
  }
  const skipped = files.length - byEvent.size;
  if (skipped) console.log(`  (${skipped} duplicate file${skipped > 1 ? "s" : ""} skipped in favor of the animated or larger version)`);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function players() {
  const dir = path.join(root, "Player Images");
  const outDir = path.join(pub, "players");
  fs.mkdirSync(outDir, { recursive: true });
  const map = {};
  for (const f of fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))) {
    const name = path.parse(f).name;
    const meta = await webp(path.join(dir, f), path.join(outDir, `${slug(name)}.webp`), 700, 84);
    map[name] = { src: `media/players/${slug(name)}.webp`, w: meta.width, h: meta.height };
  }
  return map;
}

async function cards() {
  const dir = path.join(root, "Playercards");
  const outDir = path.join(pub, "cards");
  fs.mkdirSync(outDir, { recursive: true });
  await webp(path.join(dir, "card_template.png"), path.join(outDir, "frame.webp"), 938, 90, { alphaQuality: 100 });
  await webp(path.join(dir, "card_back.png"), path.join(outDir, "back.webp"), 938, 84);
  await webp(path.join(dir, "Star.png"), path.join(outDir, "star.webp"), 96, 90, { alphaQuality: 100 });
  return { frame: "media/cards/frame.webp", back: "media/cards/back.webp", star: "media/cards/star.webp" };
}

async function logo() {
  const src = path.join(root, "GQT2026Logo.png");
  await webp(src, path.join(pub, "logo-900.webp"), 900, 86, { alphaQuality: 100 });
  await webp(src, path.join(pub, "logo-480.webp"), 480, 86, { alphaQuality: 100 });
  // share image (og:image): the logo on the navy-to-red menu wash, 1200x630
  const wash = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#0a0e17"/><stop offset=".5" stop-color="#2a1420"/><stop offset="1" stop-color="#6a1418"/></linearGradient>
    <radialGradient id="f" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#f5b81c" stop-opacity=".28"/><stop offset="1" stop-color="#f5b81c" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#f)"/></svg>`);
  const mark = await sharp(src).resize(560, 560, { fit: "inside" }).toBuffer();
  await sharp(wash).composite([{ input: mark, gravity: "center" }]).jpeg({ quality: 86 }).toFile(path.join(pub, "og.jpg"));
  return { large: "media/logo-900.webp", small: "media/logo-480.webp", og: "media/og.jpg" };
}

async function main() {
  if (!fs.existsSync(dataFile)) throw new Error("Run scripts/data.mjs first (media.json links images to events in data.json).");
  const statSlugs = JSON.parse(fs.readFileSync(dataFile, "utf8")).events.map((e) => e.slug);
  fs.mkdirSync(pub, { recursive: true });
  console.log("Event images:");
  const ev = await events(statSlugs);
  const manifest = { logo: await logo(), cards: await cards(), players: await players(), events: ev };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
  const withStats = ev.filter((e) => e.event).length;
  console.log(`Wrote ${path.relative(process.cwd(), manifestFile)}: ${ev.length} rotation slides (${withStats} linked to events with stats, ${ev.filter((e) => e.video).length} video loops)`);
  const missing = statSlugs.filter((s) => !ev.some((e) => e.event === s));
  if (missing.length) console.log(`  Events with stats but no image: ${missing.join(", ")}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
