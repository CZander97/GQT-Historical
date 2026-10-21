# GQT Invitational — brand kit

The single source of truth for the GQT Historical site. Every later phase reads
this file. Data comes from `GQT Historical Stats(1).xlsx` (tabs: All Stats,
Ratings, Overalls).

## 1. Brand name
**GQT Invitational** (short form: GQT). File slug: `gqt`.

## 2. Slogan
None. The logo and the menu carry the identity.

## 3. Positioning
The official record book of the GQT Invitational, an annual multi-event
competition among six friends: field drills, retro video games, party games,
bar games and betting. The site is the event's hall of records: who won each
year, who won each event, and how every player rates.

## 4. Target audience
The six competitors (Carter, Chris, Kjar, Kyle, Miles, Nick) and their friends.
They grew up on PS2-era sports games, so they'll recognize the Madden 05 look
right away. They'll open it on phones at the event and on laptops afterwards
to argue about stats.

## 5. Brand personality
Loud, competitive, nostalgic, trash-talking, over-produced, sports-broadcast,
tongue-in-cheek. It treats a backyard 40-yard dash with the seriousness of
an NFL Combine broadcast.

## 6. Color palette (from the GQT logo)
| Role | Hex | Use |
|---|---|---|
| Background | `#0a0e17` | navy-black page and menu backdrop (never pure black) |
| Surface | `#121a2b` | menu panels, table bodies |
| Surface 2 | `#1c2742` | raised panels, hovered rows (the dinosaur's navy) |
| Text | `#eef1f6` | primary copy |
| Muted text | `#8d97ab` | labels, secondary numbers |
| Primary accent: molten gold | `#f5b81c` | 1st place, highlights, light flares, glow |
| Secondary accent: GQT red | `#d42027` | the selected menu bar (exactly like Madden 05's red selection), negative scores |
| Chrome | `#c9ced8` | 2nd place, metallic borders |
| Bronze | `#c27a3a` | 3rd place only |
| Line | `#2a3550` | table rules, panel borders |

Gold is for winners and light. Red is reserved for "you are here", meaning the
selected menu bar and the active tab. Chrome and bronze appear on podiums.

**Rotating backdrop tints:** in Madden 05 the menu background takes the
featured team's colors (red for Arizona, blue for Detroit). Here each featured
event gets a tint taken from its own image, kept dark: for example Mario Kart
`#5a1418`, Turok `#14321e`, Smash `#1a2350`. The build samples each image's
dominant color automatically. The navy `#0a0e17` stays the fallback.

## 7. Typography (Google Fonts)
- **Display / menu:** Saira Condensed 800 and 900, uppercase. Menu labels are
  slanted with `skewX(-10deg)`, like Madden 05's bold italic bar labels.
- **Body / tables / numbers:** Barlow Semi Condensed 500, 600 and 700, with
  `font-variant-numeric: tabular-nums` so stat columns line up.
- The player cards keep their own Georgia / Helvetica styling from
  `Playercards/player_cards.html`.

## 8. Logo direction
Use the supplied `GQT2026Logo.png` as is: dinosaur, beaver gamer, popcorn and
molten-gold splash, with the chrome GQT and the gold INVITATIONAL banner. It is the
centerpiece of the title screen and sits small in the corner of every other
screen. Favicon: a chrome "GQT" monogram on navy with a gold underline (inline SVG).

## 9. Product description (what the site holds)
**Players (6):** Carter, Chris, Kjar, Kyle, Miles, Nick. Photos are in `Player Images/`.

**Years:** 2025 (11 events), 2026 (17 events).

**Events and their rating category:**
| Event | Category | 2025 | 2026 | Raw stats tracked |
|---|---|:-:|:-:|---|
| Beers Drank | Penis Size | | ✓ | beers, floor piss |
| 40 Yard Dash | Speed | ✓ | ✓ | seconds |
| Sling Pigskin | Strength | ✓ | ✓ | yards |
| Football Accuracy | Dexterity | ✓ | | targets hit |
| Mile Run | Speed | | ✓ | time |
| Free Throws | Dexterity | | ✓ | makes |
| 3 Point Contest | Dexterity | | ✓ | makes |
| Ep III ROTS | Gaming | ✓ | | placement, kills |
| ATV Offroad Fury | Driving | ✓ | | avg placement, time |
| Turok | Gaming | ✓ | ✓ | avg placement, kills |
| Smash | Gaming | ✓ | | placement, kills |
| Mario Kart | Driving | ✓ | ✓ | score |
| Quiplash | Penis Size | ✓ | ✓ | score |
| Beer Pong | Dexterity | ✓ | | placement, cups hit |
| JP Evolution | Penis Size | ✓ | | placement, kills |
| College Football | Penis Size | | ✓ | yards, TDs, INTs, wins, bonus |
| Nascar Thunder 2004 | Driving | | ✓ | DNFs |
| SW Bombad Racing | Driving | | ✓ | avg finish, best time |
| WWE Smackdown Vs Raw 2007 | Gaming | | ✓ | avg finish, KOs |
| Yu-Gi-Oh | Penis Size | | ✓ | value |
| GTA Guesser | Penis Size | | ✓ | score |
| Skyrim Guesser | Penis Size | | ✓ | score |
| JP Evolution Bets | Penis Size | | ✓ | bets won |

Every event awards **points**. A player's yearly **Total Score** is the sum of their points.

**Ratings:** a 0–99 rating per player per event (Ratings tab), rolled up into
six categories (Speed, Strength, Dexterity, Gaming, Driving, Penis Size) and a
weighted **Overall** (Overalls tab). Three Ratings cells have no saved formula
result in the file (Kjar / 3 Point Contest, Kyle / Skyrim Guesser, Nick / JP
Evolution Bets). The build recomputes them from the Averages tab with the
sheet's own formulas.

**Data notes:** the times are stored as Excel clock values. "02:11" means 2:11,
in minutes and seconds. Nick's 2026 total of **0.41** is real: he lost 996
points on JP Evolution Bets. It gets a callout.

## 10. Key benefits (what the site lets you do)
- See who stood on the podium each year, with the score gaps.
- Settle any argument about one event: a ranked board for every event, every year.
- Collect the player cards: Yu-Gi-Oh style, rated like Madden.
- Dig into the full record: every raw stat and every point (All Stats).
- Compare ratings event by event, with each player's best and worst events visible at a glance.

## 11. Visual mood
The PS2 Madden NFL 2005 main menu, rebuilt for the web. Reference video:
https://www.youtube.com/watch?v=BUnN_fJvcGg. What's on screen there, and how it maps here:

| Madden 05 | GQT site |
|---|---|
| Chrome "MADDEN 2005" logo, top-left | GQT logo top-left with a stacked wordmark beside it: "GQT" in big white caps, then "INVITATIONAL" in gold over a red rule |
| The background cycles every few seconds through a featured team: a full-bleed wash in that team's colors, light streaks and lens flares | Cycles through the **event images**: a full-bleed wash in that event's tint, gold light streaks and flares |
| A big action shot of a player, right of center, with a motion smear / ghost trail as it drifts | The **event image**, **centered in the space between the menu and the right edge** (not pinned to the edge): a slow push-in and drift, with a faded duplicate trailing behind it as the ghost |
| The team name in huge faded block caps behind the lower menu ("ARIZONA CARDINALS", "LIONS") | The **event name** in huge faded caps on one line, **under the menu and never overlapping it**, sized to fit the menu column. **Phones** stack top to bottom: logo and wordmark, then the image fitted into the space between them and the name (never behind the logo or the menu), then the name just above the menu, then the menu (56px bars) and the ticker |
| A stack of 6 full-width bars from the left edge: dark translucent fill, thin white outline, bold italic white caps | The same stack, **big**: Podiums, Leaderboards, Player Cards, All Stats, Ratings. The bars take up to 46% of the width, are about 8% of the screen height each, with labels up to 48px |
| The selected bar turns **red**, with a circled ✕ glyph before the label | The selected bar turns GQT red `#d42027` with a circled ✕ glyph (inline SVG) |
| A dark strip along the bottom with controller prompts | The strip stays, but holds a **scrolling stat ticker** instead of prompts. No button prompts (the viewer asked). Keyboard arrows / Enter / Esc still work without being shown, and inner screens get a plain "Back" control at the top |

Overall feel: glossy early-2000s broadcast graphics, slightly soft
(a faint scan-line texture and a vignette), and fast menu motion: 120–200 ms
bar slides, with an instant red snap on selection. Inner screens (podiums, tables)
keep the same frame: logo top-left, the rotating event
backdrop dimmed further behind dark panels.

## 12. Website goal
Show the record. The visitor picks a menu item and finds any stat in two clicks.

## 13. Contact & links
None needed. A private event site. *(Placeholder: footer reads "GQT
Invitational · Est. 2025".)*

## 14. Landing page sections (screens)
The site is a set of **menu screens**, not one long scroll, the way a console
menu works. Hash routes, so the back button and shared links work.
1. **Title screen**: the logo over the drifting image wall, "PRESS START" pulsing.
2. **Main menu**: the bar stack, with Podiums, Leaderboards, Player Cards, All
   Stats and Ratings, over the cycling event showcase (section 11).
3. **Podiums**: one podium per year (2025, 2026) by Total Score, 1st to 3rd on the
   blocks with the rest of the field listed below.
4. **Leaderboards**: a year switcher. A Total Score board, then one board per event
   with the raw stat and the points.
5. **Player Cards**: the six Yu-Gi-Oh cards with their flip-in reveal, sorted by Overall.
6. **All Stats**: the full table with year and player filters, sortable columns and sticky headers.
7. **Ratings**: a players × events ratings table with a heat-scale. It also shows the
   category averages and Overalls.
8. **Stat ticker**: a slim bar fixed to the bottom of every screen that
   scrolls stat lines and records, for example "2026 CHAMP: MILES · 1,254.74 PTS",
   "FASTEST 40: KYLE 5.06s (2026)" or "NICK 2026: −996 ON JP EVOLUTION BETS". It
   holds text only. No button prompts, no logo badge.

## 15. The story (five screens the visitor moves through)
| Screen | What they see | On-screen line | Copy side |
|---|---|---|---|
| Title | Logo centered, image wall drifting | "PRESS START" | center, under the logo |
| Main menu | Bar stack left, cycling event showcase right, event name huge behind | (the menu itself) | menu left, image right |
| Podiums | Two podiums side by side (stacked on phones) | "THE PODIUM" | heading top-left |
| Leaderboards | Year tabs + boards | "LEADERBOARDS" | heading top-left |
| Player Cards | Card grid flipping in | "PLAYER CARDS" | heading top-left |

The image wall always stays behind a dark scrim where text sits.

## 16. Title screen brief (replaces the hero still)
The logo is the star. It fills about 40% of the viewport height, with a slow
gold glow pulsing behind it. The event showcase cycles behind it, dimmed.
"PRESS START" blinks in gold under the logo. Pressing any key,
clicking or tapping slides in the main menu. This frame is also the share
thumbnail (`og:image`).

## 17. Design bans
- No cream or off-white page background.
- No italic accent words inside headlines. *(The whole menu stack is slanted as one
  block. That's the Madden signature, not an accent word.)*
- No numbered "01 / 02 / 03" section labels. *(Rank numbers on podiums and boards are data, so they stay.)*
- No monospace eyebrow labels.
- No pill-shaped buttons. Use angled or square-cut buttons only.
- No gradient-filled headline text. *(The chrome look lives only in the logo image
  and in the player cards' own name styling.)*
- No emoji as icons.
- No three identical feature cards in a row.
- No purple-to-blue gradients.
- No glass effect on every card.
- No flex/grid `gap` on an element that holds a running line of text: it spreads the words apart.
  This happened twice in Phase 4 (the ticker and the Ouch callout). Wrap the text in one span.
- No hover-only controls: anything that moves forever gets a real pause button (phones can't hover).
- No controller button prompts anywhere (○ Back · ✕ Select · △ Help). The bottom bar holds the stat ticker and nothing else (the viewer's call).

## 18. Experience
**Menu-driven site in the Madden 05 style, no generated media.** It replaces the
skill file's 3D and film options. Every image is the viewer's own.

- **Opening:** a title screen first (logo, PRESS START). Any click or key slides in the menu.
- **Showcase rotation:** **all** images in `Event Images/`, including events with no
  stats yet. Each slide shows for about 6.5 s with a white flash on the cut. Each slide has
  a tint, a hero image with a slow push-in, a blurred ghost trailing it, and the event name
  huge in faded caps. Duplicates (two Free Throws, 40 Yard Dash jpg + gif, Kicking
  png + gif): use the sharper or animated version, one slide per event.
- **GIFs:** converted to short muted MP4 loops (with `ffmpeg-static`) and played as
  `<video autoplay muted loop playsinline>`.
- **Inner screens:** the rotation keeps going behind them, darker and blurred, under solid panels.
- **Ticker:** text only, fixed at the bottom, on every screen.
- **Approved look:** `website/mockup.html` (Phase 2). The menu bars, tint wash,
  light streaks, flare, scan lines and vignette carry into the real build.
- **Review gate:** besides the copy and design gates, Phase 4's verify step runs the
  `web-design-guidelines` skill (Vercel's Web Interface Guidelines) over `website/index.html`
  and `website/src/` and fixes every finding before the viewer sees the site.
- **Media (Phase 3, done):** `npm run media` → `public/media/` + `src/media.json`.
  - 36 slides from 39 files (Free Throws, 40 Yard Dash and Kicking duplicates merged).
  - 5 GIFs became MP4 loops (about 10.5 MB down to about 1 MB). Total media is 4.5 MB.
  - Tints are taken from each image, saturated, with dull yellows pushed to amber.
  - Phase 4 rules: never enlarge an image past about 2.5× its real size (small covers:
    Battlefront II, Godzilla, JP Evolution, ATV, Mario Strikers). Cornhole is pixel art, so it gets
    `image-rendering: pixelated`. JP Evolution Bets has no image of its own, so it uses JP Evolution's.
- **Data (Phase 3, done):** `npm run data` (it also runs before every dev/build) → `src/data.json`.
  - Every yearly total matches the sum of its points.
  - The unlabeled stat columns get the host's labels: Mile Run → "Time", Free Throws and
    3 Point Contest → "Makes" (in `scripts/data.mjs`). A label typed into row 4 of the sheet overrides them.
  - Tied scores share a rank.
  - The Ratings screen centers its shading on whatever rating the sheet gives an average result.
    It reads that from the unnamed reference row under the players: 70 in Stats(1), 80 in Stats(2).
  - Ratings colors (the viewer's call): full red at 50 and below, then fading to the table's own
    dark blue at the midpoint (74.5), then green building to full at 99. There is no gray and no blended
    olive middle. The same scale applies to every row, JP Evolution Bets included.
- **Stack:** Vite + vanilla JS, no three.js and no smooth-scroll library. Data is read from the
  workbook at build time by a Node script into `src/data.json`.
