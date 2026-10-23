// Podiums: one per year by Total Score. The top three stand on gold, chrome and
// bronze blocks; the rest of the field is listed underneath with the gap to first.
import { data, esc, head, foot, pts, photo, eventsBySlug } from "../ui.js";

function ouchLines(year) {
  return data.allStats
    .filter((r) => r.year === year)
    .flatMap((r) => Object.entries(r.results).map(([slug, x]) => ({ player: r.player, slug, points: x.points })))
    .filter((x) => typeof x.points === "number" && x.points <= -100)
    .sort((a, b) => a.points - b.points);
}

function step(p) {
  const img = photo(p.player);
  return `<li class="step step--${p.rank <= 3 ? p.rank : "x"}" data-rank="${p.rank}">
    <div class="step__fig">${img ? `<img src="${img.src}" width="${img.w}" height="${img.h}" alt="" decoding="async" />` : ""}</div>
    <div class="step__plate"><span class="step__name"><a href="#stats/player=${encodeURIComponent(p.player)}">${esc(p.player)}</a></span><span class="step__score">${pts(p.total, { fixed: true })} <small>pts</small></span></div>
    <div class="step__block" aria-hidden="true"><span>${p.rank}</span></div>
    <span class="sr-only">Place ${p.rank}</span>
  </li>`;
}

function podium(year) {
  const standings = data.byYear[year].standings;
  const top = standings.slice(0, 3);
  const rest = standings.slice(3);
  const lead = standings[0]?.total ?? 0;
  const ouch = ouchLines(year);
  return `<section class="podium panel" aria-labelledby="podium-${year}">
    <h2 class="podium__year" id="podium-${year}"><span>${year}</span></h2>
    <p class="podium__sub">${data.byYear[year].events.length} events · ${standings.length} players</p>
    <ol class="stage">${top.map(step).join("")}</ol>
    ${rest.length ? `<ol class="field" start="${rest[0].rank}">
      ${rest.map((p) => `<li class="field__row">
        <span class="field__rank num">${p.rank}</span>
        <span class="field__name"><a href="#stats/player=${encodeURIComponent(p.player)}">${esc(p.player)}</a></span>
        <span class="field__total">${pts(p.total, { fixed: true })} <small>pts</small></span>
        <span class="field__gap">${pts(lead - p.total, { fixed: true })} behind</span>
      </li>`).join("")}
    </ol>` : ""}
    ${ouch.length ? `<div class="ouch"><span class="ouch__tag">Ouch</span><ul class="ouch__list">
      ${ouch.map((o) => `<li>${esc(o.player)} lost ${pts(Math.abs(o.points))} points on ${esc(eventsBySlug[o.slug].name)}.</li>`).join("")}
    </ul></div>` : ""}
  </section>`;
}

export function renderPodiums(el) {
  const years = [...data.years].reverse();   // newest first
  el.innerHTML = `${head("Podiums")}
    <div class="wrap podiums">${years.map(podium).join("")}</div>
    ${foot()}`;
}
