// App entry point. Holds the single source of truth (current immutable state),
// renders the matching screen on every transition, and tears down the previous
// round's reel before mounting the next. Wires the global mute toggle.

import { byId } from './ui/dom.js';
import { renderIntro, renderResult } from './ui/screens.js';
import { renderSettings } from './ui/settingsScreen.js';
import { mountPlayRound } from './ui/playScreen.js';
import { mountPauseMenu } from './ui/pauseMenu.js';
import { createInitialState, startGame, lockPick, reset, openSettings } from './core/state.js';
import { toggleMute, music, applyAudioSettings } from './ui/sound.js';
import { preloadHeadshots } from './data/players.js';
import { getSettings, onSettingsChange } from './core/settings.js';

const root = byId('app');

// Warm the headshot cache up front so the fast reel never flashes blank cards.
preloadHeadshots();

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

/** Mount (or re-mount) the current round with a fresh reel. */
function mountCurrentRound() {
  teardownRound = mountPlayRound(root, state, {
    onLocked: (playerId) => setState(lockPick(state, playerId)),
    onPause: pauseGame,
  });
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
  mountCurrentRound();
}

function render() {
  switch (state.phase) {
    case 'intro':
      renderIntro(root, {
        onStart: () => {
          // First user gesture — safe to kick off the background groove.
          music.start();
          setState(startGame());
        },
        onSettings: () => setState(openSettings()),
      });
      break;
    case 'settings':
      renderSettings(root, { onBack: () => setState(reset()) });
      break;
    case 'playing':
      mountCurrentRound();
      break;
    case 'result':
      renderResult(root, {
        picks: state.picks,
        onPlayAgain: () => setState(reset()),
      });
      break;
    default:
      throw new Error(`Unknown phase: ${state.phase}`);
  }
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
render();
