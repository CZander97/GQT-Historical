// Leaderboards: pick a year (or All-Time), then the Total Score board or any event's board.
// Routes: #leaderboards/<year | all>/<event-slug | total>. The backdrop holds on the open event.
import { data, esc, head, foot, pts, stat, eventsBySlug, eventImage, medal } from "../ui.js";
import { featureEvent } from "../backdrop.js";

const ALL = "all";
const yy = (y) => `’${String(y).slice(2)}`;

function rankCell(rank) {
  const m = medal(rank);
  return `<td class="lb__rank"><span class="rank${m ? ` rank--${m}` : ""}">${rank}</span></td>`;
}
// a player's name opens their full record in All Stats
const playerCell = (name) => `<th scope="row" class="lb__player"><a href="#stats/player=${encodeURIComponent(name)}">${esc(name)}</a></th>`;

function totalBoard(year) {
  const all = year === ALL;
  const s = all ? data.allTime.totals : data.byYear[year].standings;
  const lead = s[0]?.total ?? 0;
  return `<div class="board__head">
      <h2 class="board__title">${all ? "Career Points" : "Total Score"}</h2>
      <p class="board__meta">${all ? "All-Time · every year’s total added up" : `${year} · every event’s points added up`}</p>
    </div>
    <div class="board__scroll"><table class="lb">
      <caption class="sr-only">${all ? "All-time career points" : `${year} Total Score standings`}</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th>${all ? `<th scope="col" class="r">Years</th>` : ""}<th scope="col" class="r">Total</th><th scope="col" class="r">Behind</th></tr></thead>
      <tbody>${s.map((p) => `<tr class="${p.rank === 1 ? "is-lead" : ""}">
        ${rankCell(p.rank)}${playerCell(p.player)}
        ${all ? `<td class="r">${p.years}</td>` : ""}
        <td class="r lb__pts">${pts(p.total, { fixed: true })}</td>
        <td class="r lb__gap">${p.total === lead ? "Leader" : `${pts(lead - p.total, { fixed: true })} behind`}</td></tr>`).join("")}
      </tbody></table></div>`;
}

function eventBoard(year, slug) {
  const all = year === ALL;
  const ev = eventsBySlug[slug];
  const board = (all ? data.allTime.events : data.byYear[year].events).find((e) => e.slug === slug).board;
  const labels = ev.statLabels.filter((l) => board.some((b) => b.stats.some((s) => s.label === l && s.v !== null && s.v !== "")));
  const key = all ? ev.rankBy?.label : null;   // All-Time boards rank by the stat that decides the event
  const ranking = !all ? "ranked by points"
    : key ? `ranked by ${esc(key)} (${ev.rankBy.dir < 0 ? "lower" : "higher"} is better)` : "ranked by points";
  const img = eventImage(slug);
  return `<div class="board__head">
      ${img ? `<img class="board__art" src="${img.poster}" width="84" height="84" alt="" loading="lazy" decoding="async" />` : ""}
      <div>
        <h2 class="board__title">${esc(ev.name)}</h2>
        <p class="board__meta">${all ? "All-Time" : year}${ev.category ? ` · <span class="cat">${esc(ev.category)}</span>` : ""} · ${ranking}</p>
      </div>
    </div>
    <div class="board__scroll"><table class="lb">
      <caption class="sr-only">${all ? "All-time" : year} ${esc(ev.name)} results, ${ranking}</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th>${all ? `<th scope="col">Year</th>` : ""}
        ${labels.map((l) => `<th scope="col" class="r${l === key ? " is-key" : ""}">${esc(l)}</th>`).join("")}<th scope="col" class="r${all && !key ? " is-key" : ""}">Points</th></tr></thead>
      <tbody>${board.map((b) => `<tr class="${b.rank === 1 ? "is-lead" : ""}">
        ${rankCell(b.rank)}${playerCell(b.player)}${all ? `<td class="lb__year">${yy(b.year)}</td>` : ""}
        ${labels.map((l) => `<td class="r${l === key ? " is-key" : ""}">${stat(b.stats.find((s) => s.label === l)?.v)}</td>`).join("")}
        <td class="r lb__pts">${pts(b.points)}</td></tr>`).join("")}
      </tbody></table></div>`;
}

export function renderLeaderboards(el, [yearParam, slugParam]) {
  const years = [...data.years].reverse();
  const year = yearParam === ALL ? ALL : data.years.includes(Number(yearParam)) ? Number(yearParam) : years[0];
  const evs = year === ALL ? data.allTime.events : data.byYear[year].events;
  const slug = evs.some((e) => e.slug === slugParam) ? slugParam : "total";
  const link = (y, s) => `#leaderboards/${y}/${s}`;
  const has = (y, s) => s === "total" || (y === ALL ? data.allTime.events : data.byYear[y].events).some((e) => e.slug === s);
  const leader = (b) => b?.[0] ? `${b[0].player}${year === ALL && b[0].year ? ` ${yy(b[0].year)}` : ""}` : "";

  // when switching tabs, stay on the same event if that tab has it
  const yearTabs = `<nav class="seg" aria-label="Year">${[...years, ALL].map((y) =>
    `<a href="${link(y, has(y, slug) ? slug : "total")}" aria-current="${y === year}"><span>${y === ALL ? "All-Time" : y}</span></a>`).join("")}</nav>`;

  const current = slug === "total"
    ? { name: year === ALL ? "Career Points" : "Total Score", winner: (year === ALL ? data.allTime.totals : data.byYear[year].standings)[0]?.player }
    : { name: eventsBySlug[slug].name, winner: leader(evs.find((e) => e.slug === slug).board) };

  // desktop: the event list is an always-open sidebar; phones: one bar naming the open board,
  // tap it to see every event (with its leader) in a grid
  el.innerHTML = `${head("Leaderboards", yearTabs)}
    <div class="wrap lbs">
      <details class="pick">
        <summary class="pick__toggle"><span>${esc(current.name)}</span><small>${esc(current.winner ?? "")}</small>
          <svg class="pick__chev" aria-hidden="true"><use href="#icon-back" /></svg><span class="sr-only">Choose a board</span></summary>
        <nav class="picker" aria-label="${year === ALL ? "All-time" : year} boards">
          <a class="picker__item picker__item--total" href="${link(year, "total")}" aria-current="${slug === "total"}"><span>${year === ALL ? "Career Points" : "Total Score"}</span></a>
          ${evs.map((e) => `<a class="picker__item" href="${link(year, e.slug)}" aria-current="${slug === e.slug}"><span>${esc(eventsBySlug[e.slug].name)}</span><small>${esc(leader(e.board))}</small></a>`).join("")}
        </nav>
      </details>
      <section class="board panel" aria-live="polite">${slug === "total" ? totalBoard(year) : eventBoard(year, slug)}</section>
    </div>
    ${foot()}`;

  const pick = el.querySelector(".pick");
  const phone = matchMedia("(max-width: 860px)");
  const sync = () => { pick.open = !phone.matches; };
  sync();
  phone.addEventListener("change", sync);

  if (!phone.matches) el.querySelector('.picker [aria-current="true"]')?.scrollIntoView({ block: "nearest" });
  if (slug !== "total") featureEvent(slug);
  return { featured: slug !== "total", keepScroll: Boolean(slugParam) && !phone.matches, cleanup: () => phone.removeEventListener("change", sync) };
}
