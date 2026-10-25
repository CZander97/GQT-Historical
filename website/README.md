# GQT Invitational · Record Book

The GQT Invitational stats site, styled after the Madden NFL 2005 main menu.
It has a title screen, the main menu, Podiums, Leaderboards, Player Cards, All Stats, Ratings, and a stat ticker.

Everything on it comes from `GQT Historical Stats*.xlsx` in the folder above this one.

**Live:** https://czander97.github.io/GQT-Historical/ (GitHub Pages, repo `CZander97/GQT-Historical`).
Every push to `main` rebuilds the site from the spreadsheet and republishes it in about two minutes
(`.github/workflows/deploy-pages.yml`; progress shows in the repo's Actions tab).

## Every year after the Invitational

1. Add the new year's rows to the spreadsheet (All Stats, Ratings, Overalls), same layout as before,
   and save it in the project folder. Keep only one `GQT Historical Stats*.xlsx` there: with two, the build stops
   and names them, so delete the old one (git keeps every earlier version).
2. New event? Add its picture to `Event Images/` (name it after the event, e.g. `Mario_Kart.jpg`;
   GIFs are fine), then run `npm run media`.
3. Publish: from the project folder run `git add -A`, then `git commit -m "Add 2027 results"`, then `git push`.
   New years, events and players appear on their own. If a player's Total Score doesn't equal their
   event points added up, the build stops and lists the rows; the live site keeps the last good version.

## Commands (run inside `website/`)

| Command | What it does |
|---|---|
| `npm install` | one-time setup |
| `npm run dev` | reads the spreadsheet, then serves the site at http://localhost:5173 |
| `npm run build` | reads the spreadsheet, then builds the static site into `dist/` (this is what gets uploaded) |
| `npm run data` | spreadsheet → `src/data.json` only |
| `npm run media` | `Event Images/`, `Player Images/`, `Playercards/`, logo → `public/media/` and `src/media.json` |

Open the built site over HTTP (`npx vite preview`), not by double-clicking `dist/index.html`.

## Where things are

- `scripts/data.mjs`: reads the workbook. It evaluates Google Sheets formulas whose results weren't saved,
  formats Excel clock values as m:ss, and labels the unlabeled Mile Run / Free Throws / 3 Point Contest columns
  (`LABEL_FALLBACKS`). A label typed into row 4 of All Stats always wins over these.
- `scripts/media.mjs`: images become WebP, GIFs become muted MP4 loops, each event gets a background tint,
  and it also makes the share image.
- `src/backdrop.js`: the rotating event showcase (tint wash, ghost trail, huge event name).
- `src/main.js`: title screen, menu, routes (`#podiums`, `#leaderboards/2026/mario-kart`, `#stats/year=2026&player=Nick`, …), ticker.
- `src/screens/`: one file per screen.
- `src/cards.css`: the player-card styles, carried over from `Playercards/player_cards.html`.

## Notes

- No forms and no contact details: nothing a visitor types is sent anywhere.
- `noindex` is set, so search engines won't list the site. Remove the robots meta tag in `index.html` if you ever want it found.
- The pause button at the right end of the ticker stops the ticker and the background rotation.
  "Reduce motion" in the OS settings does the same automatically.
