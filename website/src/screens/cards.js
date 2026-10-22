// Player Cards: the group's Yu-Gi-Oh style cards (from Playercards/player_cards.html),
// now fed by the spreadsheet. Highest Overall first; cards flip in one after another.
import { data, media, esc, head, foot, photo } from "../ui.js";

const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function card(p, index) {
  const entries = Object.entries(p.stats);
  const sixth = entries.at(-1);
  const bars = entries.map(([label, val]) => {
    const pct = Math.max(0, Math.min(100, val ?? 0));
    const bgSize = pct > 0 ? (10000 / pct).toFixed(2) : 10000;
    return `<div class="stat-row"><div class="stat-label">${esc(label)}</div>
      <div class="bar-track" role="img" aria-label="${esc(label)} ${val ?? "no rating"}"><div class="bar-fill" style="width:${pct}%;background-size:${bgSize}% 100%"></div></div></div>`;
  }).join("");
  const events = p.topEvents.map((ev, i) => `<li class="event-item">${i + 1}. ${esc(ev)}</li>`).join("");

  // finish by tier, as in the original card file
  const fx = ["fx-shine"];
  let nameClass = "";
  if (p.overall >= 90) { fx.push("fx-holo", "fx-sparkle"); nameClass = " nm-metallic nm-silver"; }
  else if (p.overall >= 80) { fx.push("fx-holo"); nameClass = " nm-metallic nm-silver"; }
  else if (p.overall >= 75) { fx.push("fx-holo-white"); nameClass = " nm-metallic"; }
  else fx[0] = "fx-shine-soft";

  const stars = Array.from({ length: Math.floor((p.overall ?? 0) / 10) }, () => `<span class="star-icon"></span>`).join("");
  const img = photo(p.name);
  const initials = p.name.slice(0, 2).toUpperCase();

  return `<li class="card" style="--flip-delay:${(0.5 + index * 0.18).toFixed(2)}s">
    <div class="card-tilt">
      <div class="card-flip">
        <div class="face back"><img src="${media.cards.back}" width="469" height="682" alt="" /></div>
        <div class="face front">
          ${img ? `<img class="photo" src="${img.src}" width="${img.w}" height="${img.h}" alt="" decoding="async" />` : `<div class="photo-fallback">${esc(initials)}</div>`}
          <img class="frame" src="${media.cards.frame}" width="469" height="682" alt="" />
          <div class="name-zone"><div class="top-line">
            <h2 class="nm${nameClass}">${esc(p.name)}</h2>
            <div class="ovr" aria-label="Overall ${p.overall}"><span class="ovr-num">${p.overall ?? "–"}</span></div>
          </div></div>
          <div class="star-row" aria-hidden="true">${stars}</div>
          <div class="bottom-zone">
            <div class="stats-row">
              <div class="bars-col">${bars}</div>
              <div class="events-col"><div class="events-title">Top Events</div><ol class="events-list">${events}</ol></div>
            </div>
            ${sixth ? `<div class="stat6-row s6">${esc(sixth[0].toUpperCase())} / ${((sixth[1] ?? 0) / 10000).toFixed(4)} in</div>` : ""}
          </div>
          ${fx.map((c) => `<div class="effect-layer ${c}"></div>`).join("")}
        </div>
      </div>
    </div>
  </li>`;
}

// A url() inside a custom property resolves against the stylesheet (assets/), not the page, so pass an absolute URL.
export function renderCards(el) {
  el.innerHTML = `${head("Player Cards")}
    <div class="wrap"><ol class="cards" style="--star:url('${new URL(media.cards.star, document.baseURI).href}')">${data.cards.map(card).join("")}</ol></div>
    ${foot()}`;

  // the cards show their backs, then flip one by one once the back art is ready
  // (on a first visit it may still be downloading); never wait more than 1.5s
  const list = el.querySelector(".cards");
  const ready = () => list.classList.add("is-ready");
  const back = list.querySelector(".face.back img");
  Promise.race([back?.decode() ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(ready, ready);

  if (!FINE || REDUCED) return;
  // desktop: the card leans toward the cursor, at most 8 degrees
  const onMove = (e) => {
    const t = e.currentTarget, r = t.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 16).toFixed(2)}deg)`;
  };
  const onLeave = (e) => { e.currentTarget.style.transform = ""; };
  el.querySelectorAll(".card-tilt").forEach((t) => { t.addEventListener("pointermove", onMove); t.addEventListener("pointerleave", onLeave); });
}
