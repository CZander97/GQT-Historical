// Reads the GQT stats workbook and writes src/data.json for the site.
// Runs before every build, so a new year, event or player added to the
// spreadsheet shows up on the site with no code changes.
//
//   node scripts/data.mjs [path/to/workbook.xlsx]
//
// Without a path it uses the one "GQT Historical Stats*.xlsx" in the project root.
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../..");
const outFile = path.resolve(here, "../src/data.json");

function findWorkbook() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  // exactly one: GitHub's checkout gives every file the same date, so "the newest" could
  // differ between this computer and the live build
  const hits = fs.readdirSync(projectRoot).filter((f) => /^GQT Historical Stats.*\.xlsx$/i.test(f));
  if (!hits.length) throw new Error(`No "GQT Historical Stats*.xlsx" found in ${projectRoot}`);
  if (hits.length > 1) throw new Error(`Found ${hits.length} spreadsheets (${hits.join(", ")}). Keep only the newest "GQT Historical Stats*.xlsx" in ${projectRoot}.`);
  return path.join(projectRoot, hits[0]);
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ---------- cell values, including formulas whose result was not saved ----------

let wb;
function sheet(name) {
  const ws = wb.getWorksheet(name.replace(/^'|'$/g, ""));
  if (!ws) throw new Error(`Sheet "${name}" not found`);
  return ws;
}

// Raw value of a cell: number, string, Date, "" for empty. Formulas resolve to
// their saved result, or get evaluated when the file has no saved result.
function cellValue(ws, address, depth = 0) {
  const v = ws.getCell(address).value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && !(v instanceof Date)) {
    if ("result" in v && v.result !== undefined) return v.result;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.formula || v.sharedFormula) return evaluate(ws, v.formula ?? "", depth + 1);
    if (v.text) return v.text;
    if (v.error) return "";
  }
  return v;
}

// A small evaluator for the formula shapes this workbook uses (IF / MAX / MIN /
// IFERROR, cell references, arithmetic, comparisons). Google Sheets exports wrap
// its own functions as IFERROR(__xludf.DUMMYFUNCTION("…"), <computed value>);
// the second argument is the value Google computed, so we use it.
function evaluate(ws, formula, depth) {
  if (depth > 20) throw new Error("Formula recursion too deep");
  const dummy = formula.match(/^IFERROR\(__xludf\.DUMMYFUNCTION\("(?:[^"]|"")*"\),(.*)\)$/s);
  if (dummy) formula = dummy[1];
  const refs = [];
  let js = formula
    .replace(/((?:'[^']+'|[A-Za-z_][\w ]*)!)?\$?([A-Z]{1,3})\$?(\d+)\b/g, (_, sh, col, row) => {
      refs.push([sh ? sh.slice(0, -1) : null, col + row]);
      return `R(${refs.length - 1})`;
    })
    .replace(/<>/g, "!==")
    .replace(/(^|[^<>!=])=(?!=)/g, "$1===")   // strict, like Excel: 0 is not equal to ""
    .replace(/\bIF\(/gi, "IF(")
    .replace(/\bMAX\(/gi, "Math.max(")
    .replace(/\bMIN\(/gi, "Math.min(")
    .replace(/\bIFERROR\(/gi, "IFERROR(")
    .replace(/\bTRUE\b/gi, "true")
    .replace(/\bFALSE\b/gi, "false");
  const R = (i) => {
    const [sh, addr] = refs[i];
    const v = cellValue(sh ? sheet(sh) : ws, addr, depth);
    return v instanceof Date ? v.getTime() : v;
  };
  const IF = (c, a, b = false) => (c ? a : b);
  const IFERROR = (a, b) => (a === undefined || Number.isNaN(a) ? b : a);
  try {
    // The workbook is the group's own file; formulas come from it, not from visitors.
    return new Function("R", "IF", "IFERROR", `return (${js});`)(R, IF, IFERROR);
  } catch (e) {
    throw new Error(`Could not evaluate formula "${formula}" in ${ws.name}: ${e.message}`);
  }
}

// Stat values for the site. Times are stored as Excel clock values where
// "02:11" means 2 minutes 11 seconds.
function statValue(v) {
  if (v === "" || v === null || v === undefined) return null;
  if (v instanceof Date) {
    const mins = v.getUTCHours(), secs = v.getUTCMinutes();
    return { t: mins * 60 + secs, d: `${mins}:${String(secs).padStart(2, "0")}` };
  }
  if (typeof v === "number") return round(v, 3);
  return String(v).trim();
}

// ---------- All Stats ----------

function readAllStats() {
  const ws = sheet("All Stats");
  const maxCol = ws.columnCount;
  const header = (r, c) => {
    const v = cellValue(ws, ws.getRow(r).getCell(c).address);
    return typeof v === "string" ? v.trim() : v;
  };

  // Columns A-C are Player, Year, Total Score. Each event spans a group of
  // columns sharing the same row-1 name; row 4 labels them; "Points" is the score.
  const events = [];
  for (let c = 4; c <= maxCol; c++) {
    const name = header(1, c);
    if (!name || typeof name !== "string") continue;
    let ev = events.at(-1);
    if (!ev || ev.name !== name) {
      ev = { name, slug: slug(name), category: header(2, c) || null, cols: [] };
      events.push(ev);
    }
    ev.cols.push({ c, label: String(header(4, c) || "").trim() });
  }
  // Some events have no row-4 labels (Mile Run, Free Throws, 3 Point Contest in 2026):
  // the last column of the group is the points; the rest take the labels the host
  // gave us below. A label typed into row 4 of the sheet always wins over these.
  const LABEL_FALLBACKS = { "mile-run": ["Time"], "free-throws": ["Makes"], "3-point-contest": ["Makes"] };
  for (const ev of events) {
    if (ev.cols.some((x) => x.label.toLowerCase() === "points")) continue;
    ev.cols.at(-1).label = "Points";
    const unlabeled = ev.cols.slice(0, -1).filter((x) => !x.label);
    const fallback = LABEL_FALLBACKS[ev.slug] || [];
    unlabeled.forEach((x, i) => { x.label = fallback[i] || (unlabeled.length > 1 ? `Result ${i + 1}` : "Result"); });
  }

  const rows = [];
  for (let r = 5; r <= ws.rowCount; r++) {
    const player = header(r, 1);
    const year = header(r, 2);
    if (!player || typeof player !== "string" || !year) continue;
    const total = cellValue(ws, ws.getRow(r).getCell(3).address);
    const results = {};
    for (const ev of events) {
      const stats = [];
      let points = null;
      for (const { c, label } of ev.cols) {
        const v = statValue(cellValue(ws, ws.getRow(r).getCell(c).address));
        if (label.toLowerCase() === "points") points = v;
        else if (label) stats.push({ label, v });
      }
      if (points === null && stats.every((s) => s.v === null)) continue;   // didn't run this event that year
      results[ev.slug] = { points, stats };
    }
    rows.push({ player: player.trim(), year: Number(year), total: typeof total === "number" ? round(total) : null, results });
  }

  return {
    events: events.map(({ name, slug, category, cols }) => ({
      name, slug, category,
      statLabels: cols.map((c) => c.label).filter((l) => l && l.toLowerCase() !== "points"),
    })),
    rows,
  };
}

// ---------- Ratings (per player, per event, 0–99) ----------

function readRatings(eventsBySlug) {
  const ws = sheet("Ratings");
  const cols = [];
  for (let c = 4; c <= ws.columnCount; c++) {
    const name = cellValue(ws, ws.getRow(1).getCell(c).address);
    if (typeof name === "string" && name.trim()) cols.push({ c, slug: slug(name), name: name.trim(), category: String(cellValue(ws, ws.getRow(2).getCell(c).address) || "").trim() || null });
  }
  const players = {};
  let average = null, reference = null;
  for (let r = 4; r <= ws.rowCount; r++) {
    const p = cellValue(ws, ws.getRow(r).getCell(1).address);
    const values = cols.map(({ c }) => cellValue(ws, ws.getRow(r).getCell(c).address));
    if (typeof p === "string" && p.trim()) {
      players[p.trim()] = Object.fromEntries(cols.map(({ slug }, i) => [slug, typeof values[i] === "number" ? round(values[i], 1) : null]));
    } else if (Object.keys(players).length && average === null) {
      // the unnamed row under the players rates an exactly-average result (70 in the old formula,
      // 80 in the current one); the median skips one-off columns like JP Evolution Bets
      const nums = values.filter((v) => typeof v === "number").sort((a, b) => a - b);
      if (nums.length) average = round(nums[Math.floor(nums.length / 2)], 1);
      // per event too: an event on its own formula (JP Evolution Bets) has its own "average" rating
      reference = Object.fromEntries(cols.map(({ slug }, i) => [slug, typeof values[i] === "number" ? round(values[i], 1) : null]));
    }
  }
  for (const col of cols) if (!eventsBySlug[col.slug]) console.warn(`  ! Ratings has "${col.name}", which All Stats doesn't`);
  return { events: cols.map(({ slug, name, category }) => ({ slug, name, category })), players, average, reference };
}

// ---------- Overalls (category ratings + weighted Overall) ----------

function readOveralls(knownPlayers) {
  const ws = sheet("Overalls");
  const cols = [];
  for (let c = 2; c <= ws.columnCount; c++) {
    const h = cellValue(ws, ws.getRow(1).getCell(c).address);
    if (typeof h === "string" && h.trim()) cols.push({ c, name: h.trim() });
  }
  const weights = {};
  const players = {};
  for (let r = 2; r <= ws.rowCount; r++) {
    const label = cellValue(ws, ws.getRow(r).getCell(1).address);
    if (typeof label !== "string") continue;
    const values = Object.fromEntries(cols.map(({ c, name }) => {
      const v = cellValue(ws, ws.getRow(r).getCell(c).address);
      return [name, typeof v === "number" ? v : null];
    }));
    if (label.trim().toLowerCase() === "weight") Object.assign(weights, values);
    else if (knownPlayers.has(label.trim())) players[label.trim()] = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === null ? null : round(v, 1)]));
  }
  const categories = cols.map((c) => c.name).filter((n) => n.toLowerCase() !== "overall");
  return { categories, weights, players };
}

// ---------- assemble ----------

function rankBy(list, key) {
  const sorted = [...list].sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity));
  let rank = 0, prev;
  return sorted.map((x, i) => {
    if (x[key] !== prev) rank = i + 1;
    prev = x[key];
    return { ...x, rank };
  });
}

async function main() {
  const file = findWorkbook();
  wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  console.log(`Reading ${path.basename(file)}`);

  const all = readAllStats();
  const eventsBySlug = Object.fromEntries(all.events.map((e) => [e.slug, e]));
  const players = [...new Set(all.rows.map((r) => r.player))].sort();
  const years = [...new Set(all.rows.map((r) => r.year))].sort();

  // check: each total equals the sum of that row's points; a mismatch means the sheet was misread,
  // so stop the build and leave the live site as it was
  const mismatches = all.rows.map((r) => {
    const sum = round(Object.values(r.results).reduce((s, x) => s + (typeof x.points === "number" ? x.points : 0), 0));
    return r.total !== null && Math.abs(sum - r.total) > 0.05 ? `${r.player} ${r.year}: Total Score ${r.total} but points add up to ${sum}` : null;
  }).filter(Boolean);
  if (mismatches.length) throw new Error(`Totals don't match the event points:\n  ${mismatches.join("\n  ")}`);

  const byYear = {};
  for (const y of years) {
    const rows = all.rows.filter((r) => r.year === y);
    const eventSlugs = all.events.map((e) => e.slug).filter((s) => rows.some((r) => r.results[s]));
    byYear[y] = {
      standings: rankBy(rows.map((r) => ({ player: r.player, total: r.total })), "total"),
      events: eventSlugs.map((s) => ({
        slug: s,
        board: rankBy(rows.filter((r) => r.results[s]).map((r) => ({ player: r.player, points: r.results[s].points, stats: r.results[s].stats })), "points"),
      })),
    };
  }

  // Which way each stat counts, learned from the sheet: within a year, does a higher value earn
  // more points (+1, e.g. yards) or fewer (-1, e.g. times, placements)? 0 = no clear link.
  // The stat that tracks points most closely ranks the All-Time board; none -> rank by points.
  const statNum = (v) => (v && typeof v === "object" ? v.t : typeof v === "number" ? v : null);
  for (const ev of all.events) {
    ev.better = {};
    let best = null;
    for (const label of ev.statLabels) {
      let agree = 0, pairs = 0, possible = 0;
      for (const y of years) {
        const pts = all.rows.filter((r) => r.year === y && r.results[ev.slug])
          .map((r) => [statNum(r.results[ev.slug].stats.find((s) => s.label === label)?.v), r.results[ev.slug].points])
          .filter(([s, p]) => s !== null && typeof p === "number");
        possible += (pts.length * (pts.length - 1)) / 2;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const ds = Math.sign(pts[i][0] - pts[j][0]), dp = Math.sign(pts[i][1] - pts[j][1]);
          if (ds && dp) { agree += ds * dp; pairs++; }
        }
      }
      // trust a direction only when the stat differs in at least half the comparisons (a lone bonus doesn't count)
      const strength = pairs >= possible / 2 && pairs ? agree / pairs : 0;
      ev.better[label] = Math.abs(strength) >= 0.8 ? Math.sign(strength) : 0;
      if (ev.better[label] && (!best || Math.abs(strength) > best.strength)) best = { label, dir: ev.better[label], strength };
    }
    ev.rankBy = best ? { label: best.label, dir: best.dir } : null;
  }

  // All-Time: career points per player, and every player-year result per event
  const allTime = {
    totals: rankBy(players.map((p) => {
      const rs = all.rows.filter((r) => r.player === p);
      return { player: p, total: round(rs.reduce((s, r) => s + (r.total ?? 0), 0)), years: rs.length };
    }), "total"),
    events: all.events.filter((ev) => all.rows.some((r) => r.results[ev.slug])).map((ev) => {
      const by = ev.rankBy;
      const rows = all.rows.filter((r) => r.results[ev.slug])
        .map((r) => ({ player: r.player, year: r.year, points: r.results[ev.slug].points, stats: r.results[ev.slug].stats }))
        .map((x) => ({ ...x, key: by ? statNum(x.stats.find((s) => s.label === by.label)?.v) : x.points }));
      // ranked stat first (best first, blanks last), then points; a rank is shared only when both match
      rows.sort((a, b) => (a.key === null) - (b.key === null) || (b.key - a.key) * (by ? by.dir : 1) || (b.points ?? -Infinity) - (a.points ?? -Infinity));
      let rank = 0;
      const board = rows.map((x, i) => {
        const prev = rows[i - 1];
        if (!prev || prev.key !== x.key || prev.points !== x.points) rank = i + 1;
        const { key, ...rest } = x;
        return { ...rest, rank };
      });
      return { slug: ev.slug, board };
    }),
  };

  const ratings = readRatings(eventsBySlug);
  const overalls = readOveralls(new Set(players));

  // player cards: category bars, rounded Overall, top four event ratings
  const cards = players.map((name) => {
    const o = overalls.players[name] || {};
    const r = ratings.players[name] || {};
    const top = Object.entries(r).filter(([, v]) => typeof v === "number").sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([s]) => (ratings.events.find((e) => e.slug === s) || eventsBySlug[s] || { name: s }).name);
    const overallKey = Object.keys(o).find((k) => k.toLowerCase() === "overall");
    return {
      name,
      overall: overallKey && o[overallKey] !== null ? Math.round(o[overallKey]) : null,
      stats: Object.fromEntries(overalls.categories.map((c) => [c, o[c] ?? null])),
      topEvents: top,
    };
  }).sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const data = {
    source: path.basename(file),
    generatedAt: new Date().toISOString(),
    players,
    years,
    events: all.events,
    allStats: all.rows,
    byYear,
    allTime,
    ratings,
    overalls,
    cards,
  };
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 1));
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}: ${players.length} players, ${years.join(" + ")}, ${all.events.length} events, ${all.rows.length} player-years`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
