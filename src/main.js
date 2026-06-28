// App entry point. Holds the single source of truth (current immutable state),
// renders the matching screen on every transition, and tears down the previous
// round's reel before mounting the next. Wires the global mute toggle.

import { byId } from './ui/dom.js';
import { renderIntro, renderResult } from './ui/screens.js';
import { renderSettings } from './ui/settingsScreen.js';
import { renderModeSelect } from './ui/modeSelect.js';
import { mountPlayRound, mountReveal } from './ui/playScreen.js';
import { mountPauseMenu } from './ui/pauseMenu.js';
import {
  createInitialState, openModeSelect, startGame, lockPick, advanceAfterReveal, reset, openSettings,
} from './core/state.js';
import { toggleMute, music, applyAudioSettings } from './ui/sound.js';
import { fitScreen } from './ui/fit.js';
import { DEFAULT_MODE } from './data/modes.js';
import { preloadModeHeadshots } from './data/headshots.js';
import { getSettings, onSettingsChange } from './core/settings.js';

const root = byId('app');

// Warm the default mode's headshot cache so the first reel never flashes blank.
preloadModeHeadshots(DEFAULT_MODE);

/** Push the current settings into the engine (audio levels + motion class). */
function applyEffects(settings) {
  applyAudioSettings(settings);
  document.body.classList.toggle('no-spin-fx', !settings.spinFx);
}
applyEffects(getSettings());
onSettingsChange(applyEffects);

let state = createInitialState();
let teardownRound = null; // cleanup for the active play round, if any
let teardownPause = null; // cleanup for the pause overlay, if open
let paused = false;

/** Swap state and re-render. The only place `state` is reassigned. */
function setState(next) {
  if (teardownPause) {
    teardownPause();
    teardownPause = null;
    paused = false;
  }
  if (teardownRound) {
    teardownRound();
    teardownRound = null;
  }
  state = next;
  render();
}

/** Mount the right play view for the current state: the reveal of a just-locked
 *  pick, or a fresh spinning round. Used by both render() and resume(). */
function mountPlaying() {
  const onBack = () => setState(openModeSelect()); // quit current build -> mode menu
  if (state.reveal) {
    teardownRound = mountReveal(root, state, {
      onAdvance: () => setState(advanceAfterReveal(state)),
      onPause: pauseGame,
      onBack,
    });
  } else {
    teardownRound = mountPlayRound(root, state, {
      onLocked: (playerId) => setState(lockPick(state, playerId)),
      onPause: pauseGame,
      onBack,
    });
  }
}

/** Freeze the round and open the pause overlay. */
function pauseGame() {
  if (state.phase !== 'playing' || paused) return;
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
      setState(reset());
    },
  });
}

/** Close the pause overlay and resume the same round (picks preserved). */
function resumeGame() {
  if (!paused) return;
  if (teardownPause) {
    teardownPause();
    teardownPause = null;
  }
  paused = false;
  mountPlaying();
  fitActiveScreen();
}

/** Scale the freshly-rendered screen to fit the viewport (no scroll). */
function fitActiveScreen() {
  fitScreen(root.querySelector('.screen'));
}

function render() {
  switch (state.phase) {
    case 'intro':
      renderIntro(root, {
        // First user gesture — safe to kick off the background groove.
        onStart: () => {
          music.start();
          setState(openModeSelect());
        },
        onSettings: () => setState(openSettings()),
      });
      break;
    case 'modeSelect':
      renderModeSelect(root, {
        onPick: (mode) => {
          music.start();
          preloadModeHeadshots(mode);
          setState(startGame(mode));
        },
        onBack: () => setState(reset()),
      });
      break;
    case 'settings':
      renderSettings(root, { onBack: () => setState(reset()) });
      break;
    case 'playing':
      mountPlaying();
      break;
    case 'result':
      renderResult(root, {
        mode: state.mode,
        picks: state.picks,
        onPlayAgain: () => setState(startGame(state.mode)),
        onChangeMode: () => setState(openModeSelect()),
      });
      break;
    default:
      throw new Error(`Unknown phase: ${state.phase}`);
  }
  fitActiveScreen();
  syncBrandButton();
}

function syncBrandButton() {
  const btn = document.getElementById('brand');
  if (!btn) return;
  btn.disabled = state.phase === 'intro';
}

function wireMuteButton() {
  const btn = document.getElementById('mute');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const muted = toggleMute();
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  });
}

wireMuteButton();
wireBrandButton();
render();

function wireBrandButton() {
  const btn = document.getElementById('brand');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (state.phase === 'intro') return;
    setState(reset());
  });
}
