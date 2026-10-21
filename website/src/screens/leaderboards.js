// Leaderboards: pick a year, then the Total Score board or any event's board.
// Routes: #leaderboards/<year>/<event-slug | total>. The backdrop holds on the open event.
import { data, esc, head, foot, pts, stat, eventsBySlug, eventImage, medal } from "../ui.js";
import { featureEvent } from "../backdrop.js";

function rankCell(rank) {
  const m = medal(rank);
  return `<td class="lb__rank"><span class="rank${m ? ` rank--${m}` : ""}">${rank}</span></td>`;
}

function totalBoard(year) {
  const s = data.byYear[year].standings;
  const lead = s[0]?.total ?? 0;
  return `<div class="board__head">
      <h2 class="board__title">Total Score</h2>
      <p class="board__meta">${year} · every event’s points added up</p>
    </div>
    <div class="board__scroll"><table class="lb">
      <caption class="sr-only">${year} Total Score standings</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col" class="r">Total</th><th scope="col" class="r">Behind</th></tr></thead>
      <tbody>${s.map((p) => `<tr class="${p.rank === 1 ? "is-lead" : ""}">
        ${rankCell(p.rank)}<th scope="row" class="lb__player">${esc(p.player)}</th>
        <td class="r lb__pts">${pts(p.total, { fixed: true })}</td>
        <td class="r lb__gap">${p.total === lead ? "Leader" : `${pts(lead - p.total, { fixed: true })} behind`}</td></tr>`).join("")}
      </tbody></table></div>`;
}

function eventBoard(year, slug) {
  const ev = eventsBySlug[slug];
  const board = data.byYear[year].events.find((e) => e.slug === slug).board;
  const labels = ev.statLabels.filter((l) => board.some((b) => b.stats.some((s) => s.label === l && s.v !== null && s.v !== "")));
  const img = eventImage(slug);
  return `<div class="board__head">
      ${img ? `<img class="board__art" src="${img.poster}" width="84" height="84" alt="" loading="lazy" decoding="async" />` : ""}
      <div>
        <h2 class="board__title">${esc(ev.name)}</h2>
        <p class="board__meta">${year}${ev.category ? ` · <span class="cat">${esc(ev.category)}</span>` : ""} · ranked by points</p>
      </div>
    </div>
    <div class="board__scroll"><table class="lb">
      <caption class="sr-only">${year} ${esc(ev.name)} results</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th>
        ${labels.map((l) => `<th scope="col" class="r">${esc(l)}</th>`).join("")}<th scope="col" class="r">Points</th></tr></thead>
      <tbody>${board.map((b) => `<tr class="${b.rank === 1 ? "is-lead" : ""}">
        ${rankCell(b.rank)}<th scope="row" class="lb__player">${esc(b.player)}</th>
        ${labels.map((l) => `<td class="r">${stat(b.stats.find((s) => s.label === l)?.v)}</td>`).join("")}
        <td class="r lb__pts">${pts(b.points)}</td></tr>`).join("")}
      </tbody></table></div>`;
}

export function renderLeaderboards(el, [yearParam, slugParam]) {
  const years = [...data.years].reverse();
  const year = data.years.includes(Number(yearParam)) ? Number(yearParam) : years[0];
  const evs = data.byYear[year].events;
  const slug = evs.some((e) => e.slug === slugParam) ? slugParam : "total";
  const link = (y, s) => `#leaderboards/${y}/${s}`;

  // when switching years, stay on the same event if that year had it
  const yearTabs = `<nav class="seg" aria-label="Year">${years.map((y) => {
    const s = slug === "total" || data.byYear[y].events.some((e) => e.slug === slug) ? slug : "total";
    return `<a href="${link(y, s)}" aria-current="${y === year}"><span>${y}</span></a>`;
  }).join("")}</nav>`;

  el.innerHTML = `${head("Leaderboards", yearTabs)}
    <div class="wrap lbs">
      <nav class="picker" aria-label="${year} boards">
        <a class="picker__item picker__item--total" href="${link(year, "total")}" aria-current="${slug === "total"}"><span>Total Score</span></a>
        ${evs.map((e) => {
          const ev = eventsBySlug[e.slug];
          return `<a class="picker__item" href="${link(year, e.slug)}" aria-current="${slug === e.slug}"><span>${esc(ev.name)}</span><small>${esc(e.board[0]?.player ?? "")}</small></a>`;
        }).join("")}
      </nav>
      <section class="board panel" aria-live="polite">${slug === "total" ? totalBoard(year) : eventBoard(year, slug)}</section>
    </div>
    ${foot()}`;

  el.querySelector('.picker [aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  if (slug !== "total") featureEvent(slug);
  return { featured: slug !== "total", keepScroll: Boolean(slugParam) && innerWidth > 768 };
}
