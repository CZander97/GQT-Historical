# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + vanilla JavaScript, built to plain static files (`website/dist`) and published to Hostinger. A Node build script reads `GQT Historical Stats(1).xlsx` and writes the site's data. There's no framework and no backend. (Confirmed by the user.)

## Users

The six GQT Invitational competitors (Carter, Chris, Kjar, Kyle, Miles, Nick) and their friends. They open it on phones during the event to check standings, and on laptops afterwards to settle arguments about who's better at what. It's a private, in-group audience. No outside visitors are expected, so the site doesn't need to explain the event to strangers.

## Product Purpose

The official record book of the GQT Invitational, an annual multi-event competition (field drills, retro video games, party games, bar games and betting). It answers four questions in a couple of clicks:
- who won each year
- who won each event
- how every player rates
- the raw numbers behind it all

Success means any stat argument at the event can be settled from a phone in seconds.

## Positioning

It's the group's own history, scored with their own points system and rating formulas, and presented the way the group's favorite PS2-era sports games presented stats. No generic stats tool has their events, their ratings or their inside jokes.

## Operating Context

- **Source of truth:** `GQT Historical Stats(1).xlsx`. It has five tabs; the site uses three:
  - **All Stats**: raw results plus points per event per player per year, and yearly Total Score.
  - **Ratings**: a 0–99 rating per player per event.
  - **Overalls**: six category ratings plus a weighted Overall per player.
- **Yearly ritual:** after each Invitational the host adds that year's rows to the spreadsheet. The site rebuilds from the file, so new years, events and players must appear without hand-editing the site.
- **Existing card design:** `Playercards/player_cards.html` is the group's existing Yu-Gi-Oh style player cards (frame, card back, star icon, player photos). The site reuses it.

## Capabilities and Constraints

- **Screens:** title screen, main menu, Podiums (per year, by Total Score), Leaderboards (per year: a Total Score board plus one board per event), Player Cards, All Stats table, Ratings table, and a scrolling stat ticker.
- **Data quirks the build must handle:**
  - Times are stored as Excel clock values; "02:11" means 2:11 in minutes and seconds.
  - Some Ratings cells have formulas with no saved result, so they're recomputed from the Averages tab.
  - Scores can be negative. Nick's 2026 total of 0.41 is real: −996 on JP Evolution Bets.
- **Must scale:** to new years, new events and new players from the spreadsheet alone.
- **Terminology:** event and category names exactly as in the spreadsheet, including the "Penis Size" rating category, which the group chose.

## Brand Commitments

- **Name:** GQT Invitational. No slogan.
- **Logo:** `GQT2026Logo.png` (dinosaur, beaver gamer, popcorn, molten-gold splash, chrome GQT and gold INVITATIONAL banner), used as is.
- **Voice:** loud, competitive, nostalgic, trash-talking sports broadcast.
- **Binding reference (from the user):** the Madden NFL 2005 main menu (https://www.youtube.com/watch?v=BUnN_fJvcGg), with the event images moving in the background. The user has also explicitly ruled out on-screen controller button prompts.
- The player cards keep their Yu-Gi-Oh card form.
- Full visual detail lives in `copy/brand-kit.md`.

## Evidence on Hand

- **Data:** `GQT Historical Stats(1).xlsx`: 6 players; 2025 (11 events) and 2026 (17 events).
- **Event images:** `Event Images/`, 39 files (game covers, sports photos, 5 animated GIFs). Some show events that have no stats yet.
- **Player photos:** `Player Images/` (also copied in `Playercards/`).
- **Card assets:** `Playercards/card_template.png`, `card_back.png`, `Star.png`.
- **Missing, and not to be made up:** contact details, event dates, locations, prizes, any history before 2025.

## Product Principles

1. The spreadsheet is the truth. Every number on the site comes from it, untouched.
2. Any stat is two clicks from the main menu.
3. It has to work on a phone at the event, not just on a laptop.
4. Next year's data drops in without anyone editing the site.
5. Keep the in-group voice. Labels and jokes stay as the group wrote them.
