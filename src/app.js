import {
  BIG_WIN_MULTIPLIER,
  INITIAL_BALANCE,
  LEGAL_PATHS,
  MAX_BET,
  MIN_BET,
  PAYTABLE,
  spin
} from "./gameLogic.js";
import { RetroSpaceBackground } from "./spaceBackground.js";

const SPIN_DURATION_MS = 950;
const REEL_STOP_STAGGER_MS = 130;
const CONFETTI_COLORS = Object.freeze(["#2ff8ff", "#ff3df2", "#9b5cff", "#ffd166", "#54ffad"]);
const SYMBOL_EMBLEMS = Object.freeze({
  "7": "7",
  BAR: "▰",
  GEM: "◆",
  STAR: "★",
  ORB: "◎",
  COMET: "☄"
});

const SYMBOL_LABELS = Object.freeze({
  "7": "Seven",
  BAR: "Bar",
  GEM: "Gem",
  STAR: "Star",
  ORB: "Orb",
  COMET: "Comet"
});

const elements = {
  balance: document.querySelector("#balance"),
  bet: document.querySelector("#bet"),
  controls: document.querySelector("#controls"),
  decreaseBet: document.querySelector("#decrease-bet"),
  increaseBet: document.querySelector("#increase-bet"),
  paylineList: document.querySelector("#payline-list"),
  paytableList: document.querySelector("#paytable-list"),
  paytablePanel: document.querySelector("#paytable-panel"),
  paytableToggle: document.querySelector("#paytable-toggle"),
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
renderPaylines();
renderBalance();
updateBetBounds();
background.start();

elements.controls.addEventListener("submit", handleSpin);
elements.decreaseBet.addEventListener("click", () => adjustBet(-1));
elements.increaseBet.addEventListener("click", () => adjustBet(1));
elements.bet.addEventListener("input", updateBetBounds);
elements.paytableToggle.addEventListener("click", togglePaytable);

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
    clearWinningCells();
    renderBalance();
    setStatus("Spinning...", "ready");

    await animateReels(outcome.reels);

    state.balance = outcome.balance;
    state.spinning = false;
    renderBalance();
    announceOutcome(outcome);
    highlightWinningCells(outcome.wins);
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
    const symbol = symbols[index];
    node.textContent = SYMBOL_EMBLEMS[symbol];
    node.dataset.symbol = symbol;
    node.setAttribute("aria-label", SYMBOL_LABELS[symbol]);
  });
}

/**
 * @returns {void}
 */
function clearWinningCells() {
  document.querySelectorAll(".symbol.is-winning").forEach((symbol) => {
    symbol.classList.remove("is-winning");
  });
}

/**
 * @param {ReturnType<typeof spin>["wins"]} wins Winning paths.
 * @returns {void}
 */
function highlightWinningCells(wins) {
  wins.forEach((win) => {
    win.cells.forEach((cell) => {
      elements.reels[cell.reelIndex].querySelectorAll(".symbol")[cell.rowIndex].classList.add("is-winning");
    });
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

  const isBigWin = outcome.totalMultiplier >= BIG_WIN_MULTIPLIER;
  const statusType = isBigWin ? "big" : "win";
  const comboText = outcome.wins.length === 1 ? "1 combo" : `${outcome.wins.length} combos`;

  audio.playHooray();

  if (isBigWin) {
    background.triggerWarp();
    audio.playBigWin();
  }

  background.triggerFireworks();
  launchConfetti();
  setStatus(`${comboText} pays ${outcome.payout} tokens.`, statusType);
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
      label.textContent = `${entry.count} ${SYMBOL_EMBLEMS[entry.symbol]} ${entry.symbol}`;

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
function renderPaylines() {
  const rows = [
    ["Rows may stay level or move one row up/down between adjacent reels."],
    ["Winning paths can start on any reel and use adjacent reels only."],
    [`${LEGAL_PATHS.length} legal paths are checked each spin; fixed V/diagonal shapes are not required.`]
  ].map(([text]) => {
    const row = document.createElement("div");
    row.className = "payline-row";

    const name = document.createElement("span");
    name.textContent = text;

    row.append(name);
    return row;
  });

  elements.paylineList.replaceChildren(...rows);
}

/**
 * Drops a short burst of pixel confetti over the slot machine.
 *
 * @returns {void}
 */
function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti";
  container.setAttribute("aria-hidden", "true");

  const pieces = Array.from({ length: 44 }, (_, index) => {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}vw`);
    piece.style.setProperty("--drift", `${Math.random() * 220 - 110}px`);
    piece.style.setProperty("--delay", `${Math.random() * 0.22}s`);
    piece.style.setProperty("--duration", `${1.35 + Math.random() * 0.8}s`);
    piece.style.setProperty("--color", CONFETTI_COLORS[index % CONFETTI_COLORS.length]);
    return piece;
  });

  container.append(...pieces);
  document.body.append(container);
  window.setTimeout(() => container.remove(), 2600);
}

/**
 * @returns {void}
 */
function togglePaytable() {
  const expanded = elements.paytableToggle.getAttribute("aria-expanded") === "true";
  elements.paytableToggle.setAttribute("aria-expanded", String(!expanded));
  elements.paytablePanel.hidden = expanded;
  elements.paytableToggle.querySelector(".paytable-tab__icon").textContent = expanded ? "+" : "-";
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
 * @returns {{ playHooray: () => void, playLoss: () => void, playBigWin: () => void }}
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
    playHooray: () => play([523, 659, 784, 1046], 0.12, "square"),
    playLoss: () => play([220, 146], 0.16, "sawtooth"),
    playBigWin: () => play([392, 523, 659, 784, 1046], 0.11, "square")
  };
}
