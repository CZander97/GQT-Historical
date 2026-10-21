// The rotating event showcase behind every screen, after Madden 05's cycling team
// backdrop: a full-screen wash in the featured event's tint, the event image large
// with a ghost trail, a white flash on the cut, and the event name huge and faded.
import media from "./media.json";

const SLIDE_MS = 6500;
const MAX_UPSCALE = 2.5;                         // small covers stay sharp enough
const PIXEL_ART = new Set(["cornhole"]);         // enlarge with hard pixel edges, not blur
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const show = document.getElementById("show");
const big = document.getElementById("bigname");
const flash = document.getElementById("flash");
const root = document.documentElement.style;

// Shuffle once per visit so every visit opens on a different event.
const slides = [...media.events];
for (let i = slides.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [slides[i], slides[j]] = [slides[j], slides[i]];
}

const figs = new Map();   // slug -> figure, built on first use so only shown slides download
let index = -1, timer = null, held = null, paused = false;

function figureFor(s) {
  if (figs.has(s.slug)) return figs.get(s.slug);
  const f = document.createElement("figure");
  const wide = s.w > s.h * 1.15;
  const cls = `media${wide ? " wide" : ""}${PIXEL_ART.has(s.slug) ? " pixel" : ""}`;
  // never enlarge past MAX_UPSCALE of the file's real size
  const cap = wide ? `max-width:${Math.round(s.w * MAX_UPSCALE)}px` : `max-height:${Math.round(s.h * MAX_UPSCALE)}px`;
  const size = `width="${s.w}" height="${s.h}"`;
  const still = (c) => `<img class="${cls} ${c}" src="${s.poster}" ${size} alt="" decoding="async" style="${cap}">`;
  const moving = (c) => `<video class="${cls} ${c}" src="${s.video}" poster="${s.poster}" ${size} muted loop playsinline preload="none" style="${cap}"></video>`;
  const one = s.video && !REDUCED ? moving : still;
  f.innerHTML = one("ghost") + one("hero");
  show.appendChild(f);
  figs.set(s.slug, f);
  return f;
}

function setSlide(s) {
  const f = figureFor(s);
  for (const [slug, other] of figs) {
    const on = other === f;
    other.classList.toggle("on", on);
    other.querySelectorAll("video").forEach((v) => (on && !paused ? v.play().catch(() => {}) : v.pause()));
  }
  // restart the push-in for this slide
  f.querySelectorAll(".media").forEach((m) => { m.style.animation = "none"; void m.offsetWidth; m.style.animation = ""; });
  root.setProperty("--tint", s.tint);
  big.textContent = s.name;
  layout();
  if (!REDUCED) { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); }
  // warm the next slide's image so the cut is instant
  const next = slides[(slides.indexOf(s) + 1) % slides.length];
  if (next && !figs.has(next.slug)) { const im = new Image(); im.src = next.poster; }
}

function advance() {
  if (held || paused) return;
  index = (index + 1) % slides.length;
  setSlide(slides[index]);
}

export function startBackdrop() {
  advance();
  clearInterval(timer);
  timer = setInterval(advance, SLIDE_MS);
  document.addEventListener("visibilitychange", () => {
    const v = show.querySelector("figure.on video");
    if (document.hidden || paused) v?.pause(); else v?.play().catch(() => {});
  });
}

/** The pause control: freezes the rotation and any playing loop on the current slide. */
export function setPaused(on) {
  paused = on;
  show.querySelectorAll("figure.on video").forEach((v) => (on ? v.pause() : v.play().catch(() => {})));
}

/** Hold the backdrop on one event (a leaderboard for that event is open), or release with null. */
export function featureEvent(eventSlug) {
  const s = eventSlug && (slides.find((x) => x.event === eventSlug) || slides.find((x) => eventSlug.startsWith(x.event + "-")));
  if (!s) { if (held) { held = null; advance(); } return; }
  if (held === s.slug) return;
  held = s.slug;
  index = slides.indexOf(s);
  setSlide(s);
}

// The event name sits in the band under the menu (desktop) or just above it
// (phones, where the menu sits low and the image fits between logo and name).
export function layout() {
  const bars = document.getElementById("bars").getBoundingClientRect();
  const brand = document.querySelector(".brand").getBoundingClientRect();
  const tickerTop = document.querySelector(".ticker").getBoundingClientRect().top;
  if (!bars.height) return;                         // menu not laid out (inner screen); keep last layout
  const gap = 14;
  const below = tickerTop - bars.bottom - gap * 2;
  root.setProperty("--name-size", "100px");
  const widthAt100 = big.scrollWidth || 1;
  if (below >= 70) {
    const size = Math.min(below / 0.86, (100 * (bars.width - 24)) / widthAt100, 220);
    root.setProperty("--name-size", size.toFixed(1) + "px");
    root.setProperty("--name-top", (bars.bottom + gap + (below - size * 0.86) / 2).toFixed(1) + "px");
    root.removeProperty("--show-top");
    root.removeProperty("--show-bottom");
  } else {
    const size = Math.min(56, (100 * (innerWidth * 0.94)) / widthAt100);
    const nameTop = bars.top - gap - size * 0.86;
    root.setProperty("--name-size", size.toFixed(1) + "px");
    root.setProperty("--name-top", nameTop.toFixed(1) + "px");
    root.setProperty("--show-top", (brand.bottom + gap + 4).toFixed(1) + "px");
    root.setProperty("--show-bottom", (innerHeight - nameTop + 8).toFixed(1) + "px");
  }
}

// measure on the next frame, after media queries have re-laid-out the menu
const refit = () => requestAnimationFrame(layout);
addEventListener("resize", refit);
new ResizeObserver(refit).observe(document.documentElement);
document.fonts?.ready.then(refit);
