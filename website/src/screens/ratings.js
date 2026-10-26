// Ratings: the Ratings tab (0–99 per player per event) plus the Total Overalls tab's
// category ratings, or one year's ratings. Players run across (Overall order, like the cards) so all six
// fit on a phone; events run down, grouped by category. Cells are shaded red at 50,
// the table's own dark blue halfway, green at 99 (the viewer's call).
import { data, esc, head, foot } from "../ui.js";

const LOW = 50, HIGH = 99, MID = (LOW + HIGH) / 2;   // 50 and below: full red; 99: full green
const RED = "224,71,76", GREEN = "63,163,77";

// The tint fades out toward the middle, so a mid rating shows the table's exact dark blue.
function shade(v) {
  if (v === null || v === undefined) return "";
  const c = Math.max(LOW, Math.min(HIGH, v));
  const t = Math.abs(c - MID) / (MID - LOW);         // 0 at the middle, 1 at either end
  return t < 0.02 ? "" : `background:rgba(${c < MID ? RED : GREEN},${(t * 0.62).toFixed(3)})`;
}

function cell(v, best, shaded = true) {
  if (v === null || v === undefined) return `<td class="r"><span class="dash" aria-hidden="true">–</span><span class="sr-only">no rating</span></td>`;
  return `<td class="r rt${best ? " is-best" : ""}"${shaded ? ` style="${shade(v)}"` : ""}><span class="num">${Math.round(v)}</span>${best ? `<span class="sr-only"> (best)</span>` : ""}</td>`;
}

function row(label, values, { sub = "", cls = "", shaded = true } = {}) {
  const nums = values.filter((v) => typeof v === "number");
  const max = nums.length ? Math.max(...nums) : null;
  return `<tr class="${cls}"><th scope="row" class="stick stick--1">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</th>
    ${values.map((v) => cell(v, shaded && v !== null && v === max, shaded)).join("")}</tr>`;   // the plain Overall row marks no "best"
}

const CAREER = "career";

// Routes: #ratings (career) or #ratings/<year>. Career comes from the Ratings and Total Overalls
// tabs; a year from its "<year> RatingsOverall" tab, which lists only the events rated that year.
export function renderRatings(el, [param] = []) {
  const years = Object.keys(data.ratings.years).sort().reverse();
  const view = years.includes(param) ? param : CAREER;
  const src = view === CAREER ? { events: data.ratings.events, players: data.ratings.players, overalls: data.overalls } : data.ratings.years[view];
  const o = src.overalls;
  const overallKey = Object.keys(Object.values(o.players)[0] || {}).find((k) => k.toLowerCase() === "overall") || "Overall";
  // Overall order, best first (career matches the cards)
  const players = view === CAREER ? data.cards.map((c) => c.name)
    : Object.keys(o.players).sort((a, b) => (o.players[b][overallKey] ?? -1) - (o.players[a][overallKey] ?? -1));
  const groups = o.categories.map((cat) => ({ cat, events: src.events.filter((e) => e.category === cat) }))
    .concat([{ cat: "Other", events: src.events.filter((e) => !o.categories.includes(e.category)) }])
    .filter((g) => g.events.length);
  const span = players.length + 1;
  const tabs = `<nav class="seg" aria-label="Ratings period">${[CAREER, ...years].map((v) =>
    `<a href="#ratings${v === CAREER ? "" : "/" + v}" aria-current="${v === view}"><span>${v === CAREER ? "Career" : v}</span></a>`).join("")}</nav>`;

  el.innerHTML = `${head("Ratings", tabs)}
    <div class="wrap">
      <div class="legend" aria-hidden="true">
        <span class="num">${LOW}</span><span class="legend__bar"></span><span class="num">${HIGH}</span>
        <p>Red at ${LOW} and below, plain at ${Math.round(MID)}, green at ${HIGH}. The best rating in each row is marked in gold.</p>
      </div>
      <div class="panel tbl-panel">
        <div class="tbl-scroll" tabindex="0" role="region" aria-label="Ratings table">
        <table class="tbl rt-tbl">
          <caption class="sr-only">${view === CAREER ? "Career ratings" : `${view} ratings`} out of 99 for each player, by category and by event</caption>
          <thead><tr><th scope="col" class="stick stick--1">Rating</th>${players.map((p) => `<th scope="col" class="r">${esc(p)}</th>`).join("")}</tr></thead>
          <tbody>
            ${row(overallKey, players.map((p) => o.players[p]?.[overallKey] ?? null), { cls: "is-overall", shaded: false })}
            ${o.categories.map((c) => row(c, players.map((p) => o.players[p]?.[c] ?? null), { cls: "is-cat" })).join("")}
          </tbody>
          ${groups.map((g) => `<tbody>
            <tr class="grp-row"><th scope="rowgroup" colspan="${span}">${esc(g.cat)}<small>${g.events.length} event${g.events.length > 1 ? "s" : ""}</small></th></tr>
            ${g.events.map((e) => row(e.name, players.map((p) => src.players[p]?.[e.slug] ?? null))).join("")}
          </tbody>`).join("")}
        </table></div>
      </div>
    </div>
    ${foot()}`;
}
