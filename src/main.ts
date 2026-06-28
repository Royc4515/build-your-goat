// App entry point (host layer). Owns app navigation (which screen is showing) +
// the current immutable MatchState, renders the matching screen on every
// transition, and tears down the previous round's reel before mounting the next.
//
// All game RULES live in the pure engine (engine/match). This file is the host:
// DOM wiring, audio, screen routing, and seeding. The engine never sees the DOM;
// the host never reimplements a rule.

import { byId } from './ui/dom.js';
import { renderIntro, renderResult } from './ui/screens.js';
import { renderSettings } from './ui/settingsScreen.js';
import { renderModeSelect } from './ui/modeSelect.js';
import { mountPlayRound, mountReveal, mountAIThinking } from './ui/playScreen.js';
import { mountPauseMenu } from './ui/pauseMenu.js';
import {
  createMatch,
  lockPick,
  advanceAfterReveal,
  resolveAITurn,
  isComplete,
  useReroll,
  useFreeze,
} from './engine/match/match.js';
import { policyFor } from './engine/ai/policy.js';
import type { Difficulty, MatchConfig, MatchState, ModeId } from './engine/types.js';
import { HUMAN } from './engine/types.js';
import { scoreBuild } from './engine/scoring/scoring.js';
import { toggleMute, music, applyAudioSettings } from './ui/sound.js';
import { fitScreen } from './ui/fit.js';
import { openTutorial, hasSeenTutorial } from './ui/tutorial.js';
import { DEFAULT_MODE } from './data/modes.js';
import { preloadModeHeadshots } from './data/headshots.js';
import { getSettings, onSettingsChange } from './core/settings.js';
import { dailySeed, todayUTC, DAILY_MODE } from './engine/daily/daily.js';
import { recordDailyPlay } from './persistence/streak.js';
import type { StreakData } from './persistence/streak.js';

type Screen = 'intro' | 'modeSelect' | 'settings' | 'play';
interface AppState {
  readonly screen: Screen;
  readonly match: MatchState | null;
}

const root = byId('app');

// Host-side entropy seed. Math.random/Date are fine HERE — only the engine must
// stay deterministic; a casual match just needs a fresh seed each time. (The
// daily challenge will pass a date-derived seed instead, in M7.)
function newSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

// Warm the default mode's headshot cache so the first reel never flashes blank.
preloadModeHeadshots(DEFAULT_MODE);

/** Push the current settings into the engine (audio levels + motion class). */
function applyEffects(settings: ReturnType<typeof getSettings>): void {
  applyAudioSettings(settings);
  document.body.classList.toggle('no-spin-fx', !settings.spinFx);
}
applyEffects(getSettings());
onSettingsChange(applyEffects);

let app: AppState = { screen: 'intro', match: null };
let teardownRound: (() => void) | null = null;
let teardownPause: (() => void) | null = null;
let paused = false;

/** Swap app state and re-render. The only place `app` is reassigned. */
function setApp(next: AppState): void {
  if (teardownPause) {
    teardownPause();
    teardownPause = null;
    paused = false;
  }
  if (teardownRound) {
    teardownRound();
    teardownRound = null;
  }
  app = next;
  render();
}

/** The opponent choice made on the mode-select screen. */
export interface Opponent {
  readonly vsAI: boolean;
  readonly isDaily: boolean;
  readonly difficulty: Difficulty;
}

/** Build a match config for the chosen mode + opponent. */
function configFor(mode: ModeId, opp: Opponent): MatchConfig {
  if (opp.isDaily) {
    return { kind: 'daily', mode: DAILY_MODE, seed: dailySeed(todayUTC()), actors: ['human'] };
  }
  if (opp.vsAI) {
    return {
      kind: 'vsAI',
      mode,
      seed: newSeed(),
      actors: ['human', 'cpu'],
      policy: policyFor(opp.difficulty),
    };
  }
  return { kind: 'solo', mode, seed: newSeed(), actors: ['human'] };
}

/** Begin a fresh match in the chosen mode + opponent. */
function startMatch(mode: ModeId, opp: Opponent): AppState {
  return { screen: 'play', match: createMatch(configFor(mode, opp)) };
}

/** Re-derive the opponent choice from a finished/running match (for "play again"). */
function opponentOf(match: MatchState): Opponent {
  const vsAI = match.config.actors.includes('cpu');
  const isDaily = match.config.kind === 'daily';
  return { vsAI, isDaily, difficulty: match.config.policy?.difficulty ?? 'pro' };
}

/** Mount the right play view for the current match: result, reveal, or a fresh
 *  spinning round. Used by both render() and resume(). */
function mountPlaying(): void {
  const match = app.match;
  if (!match) return;
  const onBack = () => setApp({ screen: 'modeSelect', match: null });

  if (isComplete(match)) {
    let dailyInfo: { dateStr: string; streak: StreakData } | undefined;
    if (match.config.kind === 'daily') {
      const today = todayUTC();
      const humanResult = scoreBuild(match.boards[HUMAN], match.config.mode);
      dailyInfo = { dateStr: today, streak: recordDailyPlay(today, humanResult.overall) };
    }
    renderResult(root, {
      state: match,
      dailyInfo,
      onPlayAgain: match.config.kind !== 'daily'
        ? () => setApp(startMatch(match.config.mode, opponentOf(match)))
        : null,
      onChangeMode: () => setApp({ screen: 'modeSelect', match: null }),
    });
    return;
  }

  if (match.phase === 'aiThinking') {
    teardownRound = mountAIThinking(root, match, {
      onResolved: () => setApp({ ...app, match: resolveAITurn(match) }),
      onPause: pauseGame,
      onBack,
    });
    return;
  }

  if (match.reveal) {
    teardownRound = mountReveal(root, match, {
      onAdvance: () => setApp({ ...app, match: advanceAfterReveal(match) }),
      onPause: pauseGame,
      onBack,
      onReroll: () => setApp({ ...app, match: useReroll(match) }),
    });
  } else {
    teardownRound = mountPlayRound(root, match, {
      onLocked: (playerId: string) => setApp({ ...app, match: lockPick(match, playerId) }),
      onPause: pauseGame,
      onBack,
      onFreeze: () => setApp({ ...app, match: useFreeze(match) }),
    });
  }
}

/** Freeze the round and open the pause overlay. */
function pauseGame(): void {
  if (app.screen !== 'play' || !app.match || isComplete(app.match) || paused) return;
  paused = true;
  if (teardownRound) {
    teardownRound(); // stop the reel; the play screen stays frozen behind the overlay
    teardownRound = null;
  }
  teardownPause = mountPauseMenu(document.body, {
    onResume: resumeGame,
    onQuit: () => {
      if (teardownPause) {
        teardownPause();
        teardownPause = null;
      }
      paused = false;
      setApp({ screen: 'intro', match: null });
    },
  });
}

/** Close the pause overlay and resume the same round (picks preserved). */
function resumeGame(): void {
  if (!paused) return;
  if (teardownPause) {
    teardownPause();
    teardownPause = null;
  }
  paused = false;
  mountPlaying();
  fitActiveScreen();
}

/** Scale the freshly-rendered screen to fit the viewport (no scroll).
 *  Exception: the result screen has too much content to scale legibly;
 *  it uses its own overflow-y: auto scroll instead. */
function fitActiveScreen(): void {
  const screen = root.querySelector<HTMLElement>('.screen');
  if (screen?.classList.contains('result')) {
    fitScreen(null); // stop tracking so no scale is applied
  } else {
    fitScreen(screen);
  }
}

function render(): void {
  switch (app.screen) {
    case 'intro':
      renderIntro(root, {
        // First user gesture — safe to kick off the background groove.
        onStart: () => {
          music.start();
          setApp({ screen: 'modeSelect', match: null });
        },
        onSettings: () => setApp({ screen: 'settings', match: null }),
      });
      break;
    case 'modeSelect':
      renderModeSelect(root, {
        onPick: (mode: ModeId, opp: { vsAI: boolean; isDaily: boolean; difficulty: string }) => {
          music.start();
          preloadModeHeadshots(mode);
          setApp(startMatch(mode, { vsAI: opp.vsAI, isDaily: opp.isDaily, difficulty: opp.difficulty as Difficulty }));
        },
        onBack: () => setApp({ screen: 'intro', match: null }),
      });
      break;
    case 'settings':
      renderSettings(root, { onBack: () => setApp({ screen: 'intro', match: null }) });
      break;
    case 'play':
      mountPlaying();
      break;
    default: {
      const exhaustive: never = app.screen;
      throw new Error(`Unknown screen: ${String(exhaustive)}`);
    }
  }
  fitActiveScreen();
  syncBrandButton();
}

function syncBrandButton(): void {
  const btn = document.getElementById('brand');
  if (!btn) return;
  (btn as HTMLButtonElement).disabled = app.screen === 'intro';
}

function wireMuteButton(): void {
  const btn = document.getElementById('mute');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const muted = toggleMute();
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  });
}

function wireBrandButton(): void {
  const btn = document.getElementById('brand');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (app.screen === 'intro') return;
    setApp({ screen: 'intro', match: null });
  });
}

wireMuteButton();
wireBrandButton();
render();

// First-time players get the walkthrough once (reopenable from the intro screen).
if (!hasSeenTutorial()) openTutorial(() => fitActiveScreen());
