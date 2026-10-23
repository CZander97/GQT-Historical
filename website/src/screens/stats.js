// All Stats: the spreadsheet's All Stats tab as a table. Every player-year is a row,
// every event a column group (its raw stats, then points). Filter by year and player,
// switch to points only, sort by any points column.
import { data, esc, head, foot, pts, stat, statSortValue, eventsBySlug, decimals } from "../ui.js";

const state = { year: "all", player: "all", view: "full", sort: { key: "default", dir: -1 } };

function visibleRows() {
  return data.allStats.filter((r) => (state.year === "all" || r.year === state.year) && (state.player === "all" || r.player === state.player));
}

function sortRows(rows) {
  const { key, dir } = state.sort;
  const val = (r) => {
    if (key === "player") return r.player;
    if (key === "year") return r.year;
    if (key === "total") return r.total;
    if (key.startsWith("ev:")) {
      const [, slug, label] = key.split(":");
      const res = r.results[slug];
      if (!res) return null;
      return label === "Points" ? res.points : statSortValue(res.stats.find((s) => s.label === label)?.v);
    }
    return null;
  };
  if (key === "default") return [...rows].sort((a, b) => b.year - a.year || (b.total ?? 0) - (a.total ?? 0));
  return [...rows].sort((a, b) => {
    const x = val(a), y = val(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;            // blanks always last
    if (y === null) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir;
  });
}

function sortTh(label, key, attrs = "", cls = "") {
  const active = state.sort.key === key;
  const aria = active ? ` aria-sort="${state.sort.dir > 0 ? "ascending" : "descending"}"` : "";
  return `<th scope="col" class="${cls}"${attrs}${aria}><button class="sort${active ? " is-on" : ""}" data-sort="${esc(key)}">${esc(label)}<svg aria-hidden="true"><use href="#icon-sort" /></svg></button></th>`;
}

function table() {
  const rows = sortRows(visibleRows());
  const events = data.events.filter((e) => rows.some((r) => r.results[e.slug]));
  const cols = events.map((e) => ({ e, labels: state.view === "points" ? ["Points"] : [...e.statLabels.filter((l) => rows.some((r) => r.results[e.slug]?.stats.some((s) => s.label === l && s.v !== null))), "Points"] }));
  if (!rows.length) return `<p class="empty">No rows for that combination. ${esc(state.player)} didn’t play in ${state.year}.</p>`;
  // decimals per column from every row (not just the filtered ones), so a column never changes format
  const cell = (r, slug, l) => { const res = r.results[slug]; return !res ? null : l === "Points" ? res.points : res.stats.find((s) => s.label === l)?.v; };
  const dp = Object.fromEntries(cols.flatMap(({ e, labels }) => labels.map((l) => [`${e.slug}:${l}`, decimals(data.allStats.map((r) => cell(r, e.slug, l)))])));

  return `<div class="tbl-scroll" tabindex="0" role="region" aria-label="All stats table, scrolls sideways">
    <table class="tbl stats-tbl${state.view === "points" ? " is-points" : ""}">
      <caption class="sr-only">All stats, ${state.year === "all" ? "every year" : state.year}, ${state.player === "all" ? "every player" : state.player}</caption>
      <thead>
        <tr>
          ${sortTh("Player", "player", ' rowspan="2"', "stick stick--1")}
          ${sortTh("Year", "year", ' rowspan="2"', "stick stick--2")}
          ${sortTh("Total", "total", ' rowspan="2"', "stick stick--3 r")}
          ${cols.map(({ e, labels }) => `<th scope="colgroup" colspan="${labels.length}" class="grp">${esc(e.name)}${e.category ? `<small>${esc(e.category)}</small>` : ""}</th>`).join("")}
        </tr>
        <tr>${cols.map(({ e, labels }) => labels.map((l, i) => sortTh(l === "Points" ? "Pts" : l, `ev:${e.slug}:${l}`, "", `r sub${i === 0 ? " grp-start" : ""}${l === "Points" ? " pts-col" : ""}`)).join("")).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((r) => `<tr>
          <th scope="row" class="stick stick--1">${esc(r.player)}</th>
          <td class="stick stick--2 num">${r.year}</td>
          <td class="stick stick--3 r total">${pts(r.total, { fixed: true })}</td>
          ${cols.map(({ e, labels }) => labels.map((l, i) => {
            const res = r.results[e.slug];
            const cls = `r${i === 0 ? " grp-start" : ""}${l === "Points" ? " pts-col" : ""}`;
            if (!res) return `<td class="${cls}"><span class="dash" aria-hidden="true">–</span><span class="sr-only">did not compete</span></td>`;
            const d = dp[`${e.slug}:${l}`];
            return `<td class="${cls}">${l === "Points" ? pts(res.points, { dp: d }) : stat(cell(r, e.slug, l), d)}</td>`;
          }).join("")).join("")}
        </tr>`).join("")}
      </tbody>
    </table></div>`;
}

function controls() {
  const btn = (group, value, label) => `<button type="button" data-${group}="${esc(value)}" aria-pressed="${state[group] === value}"><span>${esc(label)}</span></button>`;
  return `<div class="controls">
    <fieldset class="seg"><legend>Year</legend>${btn("year", "all", "All")}${[...data.years].reverse().map((y) => btn("year", y, y)).join("")}</fieldset>
    <fieldset class="seg"><legend>Player</legend>${btn("player", "all", "All")}${data.players.map((p) => btn("player", p, p)).join("")}</fieldset>
    <fieldset class="seg"><legend>Show</legend>${btn("view", "full", "Every Stat")}${btn("view", "points", "Points Only")}</fieldset>
  </div>`;
}

// Filters and sort live in the URL (#stats/year=2026&player=Nick&view=points&sort=total.asc),
// so a filtered table can be bookmarked or sent to someone.
function readState(param = "") {
  const q = new URLSearchParams(param);
  const year = Number(q.get("year"));
  state.year = data.years.includes(year) ? year : "all";
  state.player = data.players.includes(q.get("player")) ? q.get("player") : "all";
  state.view = q.get("view") === "points" ? "points" : "full";
  const [key, dir] = (q.get("sort") || "").split(".");
  state.sort = key ? { key, dir: dir === "asc" ? 1 : -1 } : { key: "default", dir: -1 };
}
function writeState() {
  const q = new URLSearchParams();
  if (state.year !== "all") q.set("year", state.year);
  if (state.player !== "all") q.set("player", state.player);
  if (state.view !== "full") q.set("view", state.view);
  if (state.sort.key !== "default") q.set("sort", `${state.sort.key}.${state.sort.dir > 0 ? "asc" : "desc"}`);
  const s = q.toString();
  history.replaceState(null, "", `#stats${s ? "/" + s : ""}`);
}

export function renderStats(el, [param] = []) {
  readState(param);
  el.innerHTML = `${head("All Stats")}
    <div class="wrap">${controls()}<div class="panel tbl-panel" id="stats-table">${table()}</div></div>
    ${foot()}`;

  // the second header row sticks just under the first, whatever height the first wraps to
  const pinHeader = () => {
    const first = el.querySelector(".stats-tbl thead tr");
    if (first) el.querySelector(".stats-tbl").style.setProperty("--head-row-1", `${first.getBoundingClientRect().height}px`);
  };
  pinHeader();

  const redraw = () => {
    const scroller = el.querySelector(".tbl-scroll");
    const left = scroller?.scrollLeft ?? 0;
    el.querySelector("#stats-table").innerHTML = table();
    el.querySelector(".tbl-scroll")?.scrollTo({ left });
    pinHeader();
    el.querySelectorAll(".controls [aria-pressed]").forEach((b) => {
      const [group] = Object.keys(b.dataset);
      b.setAttribute("aria-pressed", String(String(state[group]) === b.dataset[group]));
    });
  };

  const onClick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.year) state.year = b.dataset.year === "all" ? "all" : Number(b.dataset.year);
    else if (b.dataset.player) state.player = b.dataset.player;
    else if (b.dataset.view) state.view = b.dataset.view;
    else if (b.dataset.sort) {
      const key = b.dataset.sort;
      // first tap sorts best-first: A-Z for names, lowest first for stats where lower wins (times, placements)
      const [, slug, label] = key.split(":");
      const lowerWins = key.startsWith("ev:") && label !== "Points" && eventsBySlug[slug]?.better?.[label] === -1;
      state.sort = state.sort.key === key ? { key, dir: -state.sort.dir } : { key, dir: key === "player" || lowerWins ? 1 : -1 };
    } else return;
    redraw();
    writeState();
    if (b.dataset.sort) el.querySelector(`[data-sort="${CSS.escape(b.dataset.sort)}"]`)?.focus();
  };
  el.addEventListener("click", onClick);   // #screen outlives this view, so unhook on leave
  return { cleanup: () => el.removeEventListener("click", onClick) };
}
