// Ratings: the Ratings tab (0–99 per player per event) plus the Overalls tab's
// category ratings. Players run across (Overall order, like the cards) so all six
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

function cell(v, best) {
  if (v === null || v === undefined) return `<td class="r"><span class="dash" aria-hidden="true">–</span><span class="sr-only">no rating</span></td>`;
  return `<td class="r rt${best ? " is-best" : ""}" style="${shade(v)}"><span class="num">${Math.round(v)}</span>${best ? `<span class="sr-only"> (best)</span>` : ""}</td>`;
}

function row(label, values, { sub = "", cls = "" } = {}) {
  const nums = values.filter((v) => typeof v === "number");
  const max = nums.length ? Math.max(...nums) : null;
  return `<tr class="${cls}"><th scope="row" class="stick stick--1">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</th>
    ${values.map((v) => cell(v, v !== null && v === max)).join("")}</tr>`;
}

export function renderRatings(el) {
  const players = data.cards.map((c) => c.name);            // Overall order
  const o = data.overalls;
  const overallKey = Object.keys(o.players[players[0]] || {}).find((k) => k.toLowerCase() === "overall") || "Overall";
  const groups = o.categories.map((cat) => ({ cat, events: data.ratings.events.filter((e) => e.category === cat) }))
    .concat([{ cat: "Other", events: data.ratings.events.filter((e) => !o.categories.includes(e.category)) }])
    .filter((g) => g.events.length);
  const span = players.length + 1;

  el.innerHTML = `${head("Ratings")}
    <div class="wrap">
      <div class="legend" aria-hidden="true">
        <span class="num">${LOW}</span><span class="legend__bar"></span><span class="num">${HIGH}</span>
        <p>Red at ${LOW} and below, plain at ${Math.round(MID)}, green at ${HIGH}. The best rating in each row is marked in gold.</p>
      </div>
      <div class="panel tbl-panel">
        <div class="tbl-scroll" tabindex="0" role="region" aria-label="Ratings table">
        <table class="tbl rt-tbl">
          <caption class="sr-only">Ratings out of 99 for each player, by category and by event</caption>
          <thead><tr><th scope="col" class="stick stick--1">Rating</th>${players.map((p) => `<th scope="col" class="r">${esc(p)}</th>`).join("")}</tr></thead>
          <tbody>
            ${row(overallKey, players.map((p) => o.players[p]?.[overallKey] ?? null), { cls: "is-overall" })}
            ${o.categories.map((c) => row(c, players.map((p) => o.players[p]?.[c] ?? null), { cls: "is-cat" })).join("")}
          </tbody>
          ${groups.map((g) => `<tbody>
            <tr class="grp-row"><th scope="rowgroup" colspan="${span}">${esc(g.cat)}<small>${g.events.length} event${g.events.length > 1 ? "s" : ""}</small></th></tr>
            ${g.events.map((e) => row(e.name, players.map((p) => data.ratings.players[p]?.[e.slug] ?? null))).join("")}
          </tbody>`).join("")}
        </table></div>
      </div>
    </div>
    ${foot()}`;
}
