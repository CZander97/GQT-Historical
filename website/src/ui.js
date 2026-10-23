// Small shared helpers for the screens.
import data from "./data.json";
import media from "./media.json";

export { data, media };

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const eventsBySlug = Object.fromEntries(data.events.map((e) => [e.slug, e]));

/** An empty cell: a dash for the eye, words for screen readers. */
export const DASH = `<span class="dash" aria-hidden="true">–</span><span class="sr-only">none</span>`;

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fixedNf = {};
const nfFixed = (dp) => (fixedNf[dp] ??= new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }));

/** The most decimals any number in a column uses (max 2), so the column lines up: 5.30 next to 5.06. */
export const decimals = (values) =>
  Math.min(2, Math.max(0, ...values.filter((v) => typeof v === "number").map((v) => (String(v).split(".")[1] || "").length)));

/** Points: `dp` fixed decimals for a column (totals: fixed 2), a real minus sign, red when negative. */
export function pts(n, { sign = false, fixed = false, dp } = {}) {
  if (n === null || n === undefined || n === "") return DASH;
  const neg = n < 0;
  const body = (dp !== undefined ? nfFixed(dp) : fixed ? nfFixed(2) : nf).format(Math.abs(n));
  return `<span class="num${neg ? " neg" : ""}">${neg ? "−" : sign && n > 0 ? "+" : ""}${body}</span>`;
}
/** A raw stat cell value: a time ({t, d}), a number (`dp` fixed decimals for a column), or text like "No". */
export function stat(v, dp) {
  if (v === null || v === undefined || v === "") return DASH;
  if (typeof v === "object") return `<span class="num">${esc(v.d)}</span>`;
  if (typeof v === "number") return `<span class="num">${(dp !== undefined ? nfFixed(dp) : nf).format(v)}</span>`;
  return esc(v);
}
export const statSortValue = (v) => (v === null || v === undefined || v === "" ? null : typeof v === "object" ? v.t : typeof v === "number" ? v : String(v));

/** A player photo as { src, w, h }, or null. */
export const photo = (name) => media.players[name] || null;

/** The event's slide image, for board headers (JP Evolution Bets borrows JP Evolution's). */
export function eventImage(slug) {
  return media.events.find((e) => e.event === slug) || media.events.find((e) => e.event && slug.startsWith(e.event + "-")) || null;
}

/** Shared screen header: compact logo, back to the main menu, the screen title. */
export function head(title, aside = "") {
  return `<header class="head">
    <a class="head__brand" href="#menu" aria-label="GQT Invitational main menu"><img src="${media.logo.small}" width="62" height="62" alt="" /></a>
    <a class="head__back" href="#menu"><svg aria-hidden="true"><use href="#icon-back" /></svg>Main Menu</a>
    <h1 class="head__title" id="screen-title" tabindex="-1">${esc(title)}</h1>
    ${aside ? `<div class="head__aside">${aside}</div>` : ""}
  </header>`;
}

export const foot = () => `<p class="foot">GQT Invitational · Est. ${data.years[0]} · Record through ${data.years.at(-1)}</p>`;

/** Medal tone for a rank: gold, chrome, bronze. */
export const medal = (rank) => (rank === 1 ? "gold" : rank === 2 ? "chrome" : rank === 3 ? "bronze" : "");
