import {
  BIG_WIN_MULTIPLIER,
  INITIAL_BALANCE,
  MAX_BET,
  MIN_BET,
  PAYTABLE,
  spin
} from "./gameLogic.js";
import { RetroSpaceBackground } from "./spaceBackground.js";

const SPIN_DURATION_MS = 950;
const REEL_STOP_STAGGER_MS = 130;

const elements = {
  balance: document.querySelector("#balance"),
  bet: document.querySelector("#bet"),
  controls: document.querySelector("#controls"),
  decreaseBet: document.querySelector("#decrease-bet"),
  increaseBet: document.querySelector("#increase-bet"),
  paytableList: document.querySelector("#paytable-list"),
  reels: Array.from(document.querySelectorAll(".reel")),
  spinButton: document.querySelector("#spin-button"),
  status: document.querySelector("#status")
};

const background = new RetroSpaceBackground(document.querySelector("#space-background"));
const audio = createAudioFeedback();

const state = {
  balance: INITIAL_BALANCE,
  controlsEnabled: true,
  spinning: false
};

renderPaytable();
renderBalance();
updateBetBounds();
background.start();

elements.controls.addEventListener("submit", handleSpin);
elements.decreaseBet.addEventListener("click", () => adjustBet(-1));
elements.increaseBet.addEventListener("click", () => adjustBet(1));
elements.bet.addEventListener("input", updateBetBounds);

/**
 * Handles one complete spin, with the result computed before animation starts.
 *
 * @param {SubmitEvent} event Form submit event.
 * @returns {Promise<void>}
 */
async function handleSpin(event) {
  event.preventDefault();

  if (state.spinning) {
    return;
  }

  const bet = getSanitizedBet();

  try {
    const outcome = spin({ balance: state.balance, bet });
    state.balance = Math.max(0, state.balance - bet);
    state.spinning = true;
    setControlsEnabled(false);
    renderBalance();
    setStatus("Spinning...", "ready");

    await animateReels(outcome.reels);

    state.balance = outcome.balance;
    state.spinning = false;
    renderBalance();
    announceOutcome(outcome);
    updateBetBounds();
    setControlsEnabled(!outcome.gameOver);
  } catch (error) {
    setStatus(error.message, "loss");
  }
}

/**
 * Displays the resolved reels after a smooth staggered animation.
 *
 * @param {string[][]} reels Precomputed spin result.
 * @returns {Promise<void>}
 */
function animateReels(reels) {
  elements.reels.forEach((reel) => reel.classList.add("is-spinning"));

  const stopPromises = elements.reels.map((reel, reelIndex) => {
    const delay = SPIN_DURATION_MS + reelIndex * REEL_STOP_STAGGER_MS;

    return new Promise((resolve) => {
      window.setTimeout(() => {
        renderReel(reel, reels[reelIndex]);
        reel.classList.remove("is-spinning");
        resolve();
      }, delay);
    });
  });

  return Promise.all(stopPromises);
}

/**
 * @param {HTMLElement} reel Reel element.
 * @param {string[]} symbols Three visible symbols.
 * @returns {void}
 */
function renderReel(reel, symbols) {
  const symbolNodes = reel.querySelectorAll(".symbol");
  symbolNodes.forEach((node, index) => {
    node.textContent = symbols[index];
  });
}

/**
 * @param {ReturnType<typeof spin>} outcome Resolved spin result.
 * @returns {void}
 */
function announceOutcome(outcome) {
  if (outcome.payout === 0) {
    audio.playLoss();
    setStatus(`No match. Lost ${outcome.bet} tokens.`, outcome.gameOver ? "loss" : "loss");
    return;
  }

  const isBigWin = outcome.win.multiplier >= BIG_WIN_MULTIPLIER;
  const statusType = isBigWin ? "big" : "win";

  if (isBigWin) {
    background.triggerWarp();
    audio.playBigWin();
  } else {
    audio.playWin();
  }

  setStatus(`${outcome.win.label} pays ${outcome.payout} tokens.`, statusType);
}

/**
 * @returns {void}
 */
function renderPaytable() {
  const rows = Array.from(PAYTABLE.values())
    .sort((a, b) => b.multiplier - a.multiplier || b.count - a.count || a.symbol.localeCompare(b.symbol))
    .map((entry) => {
      const row = document.createElement("div");
      row.className = "paytable-row";

      const label = document.createElement("span");
      label.textContent = entry.label;

      const multiplier = document.createElement("strong");
      multiplier.textContent = `${entry.multiplier}x`;

      row.append(label, multiplier);
      return row;
    });

  elements.paytableList.replaceChildren(...rows);
}

/**
 * @returns {void}
 */
function renderBalance() {
  elements.balance.textContent = String(state.balance);
}

/**
 * @param {string} message Status message.
 * @param {"ready" | "win" | "big" | "loss"} type Visual status type.
 * @returns {void}
 */
function setStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = `status status--${type}`;
}

/**
 * @param {number} delta Bet adjustment.
 * @returns {void}
 */
function adjustBet(delta) {
  const currentBet = getSanitizedBet();
  elements.bet.value = String(clamp(currentBet + delta, MIN_BET, getCurrentMaxBet()));
  updateBetBounds();
}

/**
 * @returns {number}
 */
function getSanitizedBet() {
  const parsedBet = Number.parseInt(elements.bet.value, 10);
  return clamp(Number.isNaN(parsedBet) ? MIN_BET : parsedBet, MIN_BET, getCurrentMaxBet());
}

/**
 * @returns {void}
 */
function updateBetBounds() {
  const maxBet = getCurrentMaxBet();
  const controlsDisabled = state.spinning || !state.controlsEnabled;

  elements.bet.min = String(MIN_BET);
  elements.bet.max = String(maxBet);
  elements.bet.value = String(getSanitizedBet());
  elements.decreaseBet.disabled = controlsDisabled || Number(elements.bet.value) <= MIN_BET;
  elements.increaseBet.disabled = controlsDisabled || Number(elements.bet.value) >= maxBet;
}

/**
 * @returns {number}
 */
function getCurrentMaxBet() {
  return Math.max(MIN_BET, Math.min(MAX_BET, state.balance));
}

/**
 * @param {boolean} enabled Whether controls are enabled.
 * @returns {void}
 */
function setControlsEnabled(enabled) {
  state.controlsEnabled = enabled;
  elements.spinButton.disabled = !enabled;
  elements.bet.disabled = !enabled;
  updateBetBounds();
}

/**
 * @param {number} value Value to clamp.
 * @param {number} min Minimum.
 * @param {number} max Maximum.
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Creates compact Web Audio cues for wins, losses, and big wins.
 *
 * @returns {{ playWin: () => void, playLoss: () => void, playBigWin: () => void }}
 */
function createAudioFeedback() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let context;

  /**
   * @param {number[]} frequencies Tone frequencies.
   * @param {number} duration Tone duration in seconds.
   * @param {OscillatorType} type Oscillator type.
   * @returns {void}
   */
  function play(frequencies, duration, type) {
    if (!AudioContext) {
      return;
    }

    context ??= new AudioContext();

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * duration * 0.82;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }

  return {
    playWin: () => play([523, 659, 784], 0.12, "square"),
    playLoss: () => play([220, 146], 0.16, "sawtooth"),
    playBigWin: () => play([392, 523, 659, 784, 1046], 0.11, "square")
  };
}
