// App shell: title screen, main menu, hash routes to the five screens, stat ticker.
import "./style.css";
import "./screens.css";
import "./cards.css";
import { data, media, esc, eventsBySlug, pts, stat } from "./ui.js";
import { startBackdrop, featureEvent, layout, setPaused, syncVideo } from "./backdrop.js";
import { renderPodiums } from "./screens/podiums.js";
import { renderLeaderboards } from "./screens/leaderboards.js";
import { renderCards } from "./screens/cards.js";
import { renderStats } from "./screens/stats.js";
import { renderRatings } from "./screens/ratings.js";

const SCREENS = {
  podiums: { render: renderPodiums, title: "Podiums" },
  leaderboards: { render: renderLeaderboards, title: "Leaderboards" },
  cards: { render: renderCards, title: "Player Cards" },
  stats: { render: renderStats, title: "All Stats" },
  ratings: { render: renderRatings, title: "Ratings" },
};

const body = document.body;
const screen = document.getElementById("screen");
const bars = [...document.querySelectorAll("#bars a")];
let lastRoute = "podiums";
let cleanup = null;

// ---------- routing: #menu, #podiums, #leaderboards/2026/mario-kart, ... ----------

function route() {
  const [name, ...params] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  cleanup?.(); cleanup = null;
  if (!name) {
    // the title screen plays once per browser session; after that the bare link opens the menu
    if (titleSeen()) { history.replaceState(null, "", "#menu"); return route(); }
    return setMode("at-title");
  }
  if (name === "menu" || !SCREENS[name]) {
    setMode("at-menu");
    select(bars.findIndex((a) => a.dataset.route === lastRoute), false);
    featureEvent(null);
    document.title = "GQT Invitational · Record Book";
    return;
  }
  const sameScreen = body.classList.contains("at-screen") && lastRoute === name;
  const focused = document.activeElement?.getAttribute("href");
  lastRoute = name;
  setMode("at-screen");
  const result = SCREENS[name].render(screen, params.map(decodeURIComponent));
  cleanup = result?.cleanup || null;
  if (!result?.featured) featureEvent(null);
  document.title = `${SCREENS[name].title} · GQT Invitational`;
  if (!(result?.keepScroll && sameScreen)) scrollTo(0, 0);   // keep the scroll only when the same screen re-renders
  // a new screen: focus its title; same screen re-rendered (year/event switch): keep focus on the link used
  const again = sameScreen && focused && [...screen.querySelectorAll("a[href]")].find((a) => a.getAttribute("href") === focused);
  (again || document.getElementById("screen-title"))?.focus({ preventScroll: true });
}

function setMode(mode) {
  const was = body.className;
  body.classList.remove("at-title", "at-menu", "at-screen");
  body.classList.add(mode);
  if (mode !== "at-screen") screen.innerHTML = "";
  syncVideo();   // the backdrop's loop stops behind inner screens
  if (mode === "at-menu" && was !== "at-menu") requestAnimationFrame(layout);
}

addEventListener("hashchange", route);

// ---------- title screen ----------

// storage can be blocked (private windows); then the title simply plays every visit
const titleSeen = () => { try { return Boolean(sessionStorage.getItem("gqt-title-seen")); } catch { return false; } };
const start = () => {
  if (!body.classList.contains("at-title")) return;
  try { sessionStorage.setItem("gqt-title-seen", "1"); } catch {}
  location.hash = "menu";
};
document.getElementById("start").addEventListener("click", start);

// ---------- menu: hover / arrows move the red bar, Enter opens, Esc backs out ----------

function select(i, focus = true) {
  if (i < 0) i = 0;
  bars.forEach((a, j) => a.setAttribute("aria-current", String(j === i)));
  if (focus) bars[i].focus();
}
bars.forEach((a, i) => {
  a.addEventListener("pointerenter", () => select(i, false));
  a.addEventListener("focus", () => select(i, false));
});

addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (body.classList.contains("at-title")) {
    if (e.key !== "Tab" && e.key !== "Shift") { e.preventDefault(); start(); }
    return;
  }
  if (body.classList.contains("at-menu") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    const k = bars.findIndex((a) => a.getAttribute("aria-current") === "true");
    select((k + (e.key === "ArrowDown" ? 1 : bars.length - 1)) % bars.length);
  }
  if (e.key === "Escape" && body.classList.contains("at-screen") && !e.defaultPrevented) location.hash = "menu";
});

// ---------- ticker: champions, event winners, the big losses, top cards ----------

function tickerLines() {
  const lines = [];
  const RANKED_BY_PLACE = /placement|plmt|finish/i;   // these read better as points than as "1"
  for (const y of [...data.years].reverse()) {
    const champ = data.byYear[y].standings[0];
    lines.push(`<b>${y} Champion</b> ${esc(champ.player)} · ${pts(champ.total, { fixed: true })} pts`);
    for (const ev of data.byYear[y].events) {
      const top = ev.board[0];
      if (!top) continue;
      const first = top.stats.find((s) => s.v !== null && s.v !== "");
      const what = first && !RANKED_BY_PLACE.test(first.label) && typeof first.v !== "string"
        ? `${stat(first.v)} ${esc(first.label.toLowerCase())}` : `${pts(top.points)} pts`;
      lines.push(`<b>${y} ${esc(eventsBySlug[ev.slug].name)}</b> ${esc(top.player)} · ${what}`);
    }
    for (const r of data.allStats.filter((r) => r.year === y)) {
      const worst = Object.entries(r.results).filter(([, x]) => typeof x.points === "number" && x.points < -100).sort((a, b) => a[1].points - b[1].points)[0];
      if (worst) lines.push(`<b>Ouch</b> ${esc(r.player)} · ${pts(worst[1].points)} on ${esc(eventsBySlug[worst[0]].name)} (${y})`);
    }
  }
  const topCard = data.cards[0];
  if (topCard) lines.push(`<b>Top Overall</b> ${esc(topCard.name)} · ${topCard.overall} OVR`);
  // champions first, then a shuffled mix
  const [head, rest] = [lines.filter((l) => l.includes("Champion")), lines.filter((l) => !l.includes("Champion"))];
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  return [...head, ...rest];
}

function buildTicker() {
  const sep = `<svg class="ticker__sep" aria-hidden="true"><use href="#icon-diamond" /></svg>`;
  const items = tickerLines().map((l) => `<span class="ticker__item"><span>${l}</span>${sep}</span>`).join("");
  const track = document.getElementById("ticker");
  track.innerHTML = items + `<span aria-hidden="true" style="display:contents">${items}</span>`;   // a second copy makes the loop continuous
  requestAnimationFrame(() => track.style.setProperty("--tick-dur", `${Math.round(track.scrollWidth / 2 / 70)}s`));   // ~70px per second
}

// ---------- pause control (ticker + backdrop) and skip link ----------

const pauseBtn = document.getElementById("pause");
pauseBtn.addEventListener("click", () => {
  const on = pauseBtn.getAttribute("aria-pressed") !== "true";
  pauseBtn.setAttribute("aria-pressed", String(on));
  pauseBtn.querySelector("use").setAttribute("href", on ? "#icon-play" : "#icon-pause");
  pauseBtn.querySelector(".sr-only").textContent = on ? "Play motion" : "Pause motion";
  body.classList.toggle("motion-paused", on);
  setPaused(on);
});

document.getElementById("skip").addEventListener("click", (e) => {
  e.preventDefault();
  if (body.classList.contains("at-screen")) document.getElementById("screen-title")?.focus();
  else { if (body.classList.contains("at-title")) location.hash = "menu"; requestAnimationFrame(() => bars[0].focus()); }
});

// ---------- boot ----------

buildTicker();
startBackdrop();
// warm the card-back art so Player Cards opens on the backs, not a blank face
(window.requestIdleCallback || setTimeout)(() => { new Image().src = media.cards.back; });
route();
