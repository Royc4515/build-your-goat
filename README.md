# Build Your GOAT 🐐 — NBA · EuroLeague · Soccer

**▶ Play now: https://royc4515.github.io/build-your-goat/** (works on desktop & mobile)

A casual, TikTok-filter-style sports game. Pick a **mode**, spin a slot reel of
legends or current stars, **lock one player into each of six skill slots** (timing
is everything — you get the face on screen when you tap), and reveal the
highest-rated "GOAT" you can assemble. Chase the perfect **99 OVR**.

**Modes:** NBA (Legends / Current), EuroLeague (Legends / Current), Soccer
(Legends / Current), and Mondial (2026 / Legends). Basketball modes score on
Scoring/Playmaking/Defense/Athleticism/Clutch/Leadership; soccer on
Pace/Shooting/Passing/Dribbling/Defending/Physical.

No build step and no dependencies. Player cards show **real headshots for every
player** — NBA stars from the official NBA CDN, and soccer / EuroLeague players
from Wikimedia Commons — framed on team-colored panels, with a CSS-only jersey
fallback if an image ever fails to load. All sound — a looping arena/hip-hop beat
plus basketball effects (dribble, swish, buzzer, crowd) — is **synthesized with
the Web Audio API**, so there are no audio files to ship or license.

## Play

The game uses ES modules, which browsers only load over HTTP (not `file://`).
Serve the folder and open it:

```bash
# any static server works — pick one
python -m http.server 8778
#   then open http://localhost:8778

npx serve .
```

### How to play
1. **Spin** — for each skill (Scoring, Playmaking, Defense, Athleticism, Clutch,
   Leadership) faces cycle rapidly through the roster.
2. **Lock In** — tap the button (or press **Space / Enter**) to snap the reel onto
   the player currently on screen. That player fills the slot.
3. **Reveal** — after six picks, your overall rating, tier, and earned badges are
   shown. Each slot scores the player's rating *in that specific skill*, so the
   best builds pick a specialist for every category.

Chemistry bonuses reward themed builds: stacking one player (One-Man Army),
leaning on a single franchise, or fielding a same-era squad.

**Pause** anytime with the ⏸ button (or **Esc**): the reel freezes and a menu
offers Resume, Settings, and Quit to Menu (with a confirmation). Quitting
abandons the current build and returns to the title screen.

## Project structure

```
index.html            # shell: court backdrop, top bar, #app mount
css/styles.css        # mobile-first styling; headshot framing + jersey fallback
js/
  main.js             # app entry: owns state, renders the matching screen
  core/
    state.js          # immutable game state + pure transitions
    settings.js       # persistent user settings store (localStorage)
    rating.js         # pure scoring: overall, chemistry, tier, badges
    random.js         # shuffle / pick helpers
  data/
    players.js        # NBA legends roster: ratings, colors, headshot ids
    categories.js     # the six basketball skill slots (round order)
    modes.js          # all modes: sport + category set + roster + lookups
  audio/
    context.js        # shared Web Audio graph (master / sfx / music buses, mute)
    sfx.js            # basketball effects: dribble, swish, buzzer, crowd
    music.js          # looping arena-beat scheduler (kick/snare/hat/bass/pad)
  ui/
    dom.js            # tiny element/helper utilities
    playerCard.js     # player card: real headshot over team panel + fallback
    reel.js           # the spinning slot reel + lock/decelerate logic
    playScreen.js     # one play round: banner, pause btn, reel, lock, slot tray
    pauseMenu.js      # in-game pause overlay (resume / settings / quit)
    screens.js        # intro and result screens
    modeSelect.js     # mode picker (sports grouped, legends/current/mondial)
    settingsScreen.js # settings UI (toggles, sliders, segmented controls)
    fit.js            # scales each screen to fit the viewport (no scroll)
    share.js          # social share sheet (X / WhatsApp / Telegram / FB / Reddit)
    sound.js          # thin audio facade (sfx + mute + music + settings) for UI
```

## Settings

Reachable via **⚙ Settings** on the title screen; choices persist in
`localStorage`. Available options:

- **Audio** — music on/off + volume, sound effects on/off + volume.
- **Gameplay** — reel speed (Chill / Normal / Hyper), spin motion FX on/off.
- **Display** — card art: **Photos** (real headshots, no letters) or **Jerseys**
  (CSS jersey art with the player's monogram).

Plus a one-tap **Reset to defaults**.

## Design notes
- **Immutable state.** Every transition in `core/state.js` returns a new frozen
  object; `main.js` is the only place the current reference is reassigned.
- **Real photos, no letters.** In the default Photos mode, cards show real
  headshots over a team-colored panel (themed via `--c1` / `--c2`) — NBA players
  use the NBA CDN (`nbaId`), while soccer / EuroLeague players use a Wikimedia
  Commons file (`photo`). The monogram is not rendered at all, so there are never
  letters behind a face. If a photo fails to load, the bare panel + number remain
  (still never a dead card).
  Headshots are preloaded so the fast reel never flashes blank. The optional
  Jerseys card-art mode brings back CSS monogram art instead.
- **Zero audio files.** Effects and the background beat are synthesized at
  runtime via the Web Audio API. Audio starts on the first user gesture (the
  START tap) per browser autoplay rules, and the mute toggle silences the master
  bus instantly.
- **Accessible.** Lock works via keyboard (Space/Enter), animations respect
  `prefers-reduced-motion`, and a mute toggle is always available.

## Customizing
- Add players in `js/data/players.js` (give each one a rating for every category
  id and a `[primary, secondary]` color pair). For a headshot, give NBA players
  an `nbaId`; for other sports add the player id to the `PHOTOS` map in
  `js/data/modes.js` with a Wikimedia Commons file name. No photo? The card just
  shows jersey art.
- Change the skills or round order in `js/data/categories.js`.
- Tune scoring, tiers, and chemistry rules in `js/core/rating.js`.
