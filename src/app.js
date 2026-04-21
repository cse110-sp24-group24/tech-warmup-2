import {
  BIG_WIN_MULTIPLIER,
  INITIAL_BALANCE,
  MIN_BET,
  PAYTABLE,
  spin
} from "./gameLogic.js";
import { RetroSpaceBackground } from "./spaceBackground.js";

const SPIN_DURATION_MS = 950;
const REEL_STOP_STAGGER_MS = 130;
const AUTO_SPIN_COUNT = 5;
const AUTO_SPIN_WIN_PAUSE_MS = 3000;
const BOOST_SPIN_COUNT = 5;
const CONFETTI_COLORS = Object.freeze(["#2ff8ff", "#ff3df2", "#9b5cff", "#ffd166", "#54ffad"]);
const CHEST_REWARDS = Object.freeze([50, 500, 0]);
const SHOP_ITEMS = Object.freeze([
  { id: "boost_2x", label: "2x Payout Boost", multiplier: 2, cost: 75 },
  { id: "boost_3x", label: "3x Payout Boost", multiplier: 3, cost: 180 }
]);
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
  autoSpinButton: document.querySelector("#auto_spin_button"),
  balance: document.querySelector("#balance"),
  bet: document.querySelector("#bet"),
  boostIndicator: document.querySelector("#boost_indicator"),
  chestGrid: document.querySelector("#chest_grid"),
  chestModal: document.querySelector("#chest_modal"),
  controls: document.querySelector("#controls"),
  decreaseBet: document.querySelector("#decrease_bet"),
  increaseBet: document.querySelector("#increase_bet"),
  paytableList: document.querySelector("#paytable_list"),
  paytablePanel: document.querySelector("#paytable_panel"),
  paytableToggle: document.querySelector("#paytable_toggle"),
  reels: Array.from(document.querySelectorAll(".reel")),
  rewardAmount: document.querySelector("#reward_amount"),
  rewardContinueButton: document.querySelector("#reward_continue_button"),
  rewardModal: document.querySelector("#reward_modal"),
  shopItems: document.querySelector("#shop_items"),
  spinButton: document.querySelector("#spin_button"),
  status: document.querySelector("#status")
};

const background = new RetroSpaceBackground(document.querySelector("#space_background"));
const audio = createAudioFeedback();

const state = {
  autoSpinning: false,
  balance: INITIAL_BALANCE,
  boost: null,
  chestOpen: false,
  controlsEnabled: true,
  spinning: false
};

renderPaytable();
renderShop();
renderBoostIndicator();
renderBalance();
updateBetBounds();
background.start();

elements.controls.addEventListener("submit", handleSpin);
elements.autoSpinButton.addEventListener("click", handleAutoSpin);
elements.decreaseBet.addEventListener("click", () => adjustBet(-1));
elements.increaseBet.addEventListener("click", () => adjustBet(1));
elements.bet.addEventListener("input", updateBetBounds);
elements.paytableToggle.addEventListener("click", togglePaytable);
elements.rewardContinueButton.addEventListener("click", closeRewardModal);

/**
 * Handles one complete spin, with the result computed before animation starts.
 *
 * @param {SubmitEvent} event Form submit event.
 * @returns {Promise<void>}
 */
async function handleSpin(event) {
  event.preventDefault();

  if (state.spinning || state.autoSpinning) {
    return;
  }

  await runSpin();
}

/**
 * Runs five automatic spins unless the player runs out of tokens first.
 *
 * @returns {Promise<void>}
 */
async function handleAutoSpin() {
  if (state.spinning || state.autoSpinning) {
    return;
  }

  const autoSpinBet = getSanitizedBet();
  state.autoSpinning = true;
  setControlsEnabled(false);

  try {
    let completedSpins = 0;
    while (completedSpins < AUTO_SPIN_COUNT && state.balance >= autoSpinBet) {
      const outcome = await runSpin({ bet: autoSpinBet, restoreControls: false });

      if (!outcome) {
        break;
      }

      completedSpins += 1;

      if (state.balance < MIN_BET) {
        break;
      }

      if (outcome?.payout > 0) {
        await delay(AUTO_SPIN_WIN_PAUSE_MS);
      }
    }
  } finally {
    state.autoSpinning = false;
    state.spinning = false;
    updateBetBounds();
    setControlsEnabled(state.balance >= MIN_BET && !state.chestOpen);
  }
}

/**
 * Runs one spin while keeping spin() as the permanent balance authority.
 *
 * @param {{ bet?: number, restoreControls?: boolean }} [options] Cleanup behavior.
 * @returns {Promise<ReturnType<typeof spin> | undefined>}
 */
async function runSpin({ bet = getSanitizedBet(), restoreControls = true } = {}) {
  if (state.spinning) {
    return undefined;
  }

  const startingBalance = state.balance;
  let outcome;

  state.spinning = true;
  setControlsEnabled(false);

  try {
    outcome = spin({ balance: startingBalance, bet });
    outcome = applyBoostToOutcome(outcome);
    clearWinningCells();
    setTemporaryBalance(Math.max(0, startingBalance - bet));
    setStatus("Spinning...", "ready");

    await animateReels(outcome.reels);

    state.balance = outcome.balance;
    announceOutcome(outcome);
    highlightWinningCells(outcome.wins);
    consumeBoostSpin();
    return outcome;
  } catch (error) {
    state.balance = outcome?.balance ?? startingBalance;
    setStatus(error.message, "loss");
    return outcome;
  } finally {
    state.spinning = false;
    renderBalance();
    updateBetBounds();

    if (restoreControls) {
      setControlsEnabled(state.balance >= MIN_BET && !state.chestOpen);
    }

    if (state.balance < MIN_BET && !state.chestOpen) {
      openChestModal();
    }
  }
}

/**
 * Displays the resolved reels after a smooth staggered animation.
 *
 * @param {string[][]} reels Precomputed spin result.
 * @returns {Promise<void>}
 */
function animateReels(reels) {
  elements.reels.forEach((reel) => reel.classList.add("is_spinning"));

  const stopPromises = elements.reels.map((reel, reelIndex) => {
    const delay = SPIN_DURATION_MS + reelIndex * REEL_STOP_STAGGER_MS;

    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        try {
          renderReel(reel, reels[reelIndex]);
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          reel.classList.remove("is_spinning");
        }
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
  document.querySelectorAll(".symbol.is_winning").forEach((symbol) => {
    symbol.classList.remove("is_winning");
  });
}

/**
 * @param {ReturnType<typeof spin>["wins"]} wins Winning paths.
 * @returns {void}
 */
function highlightWinningCells(wins) {
  wins.forEach((win) => {
    win.cells.forEach((cell) => {
      elements.reels[cell.reelIndex].querySelectorAll(".symbol")[cell.rowIndex].classList.add("is_winning");
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
 * Applies the active payout boost to a resolved spin.
 *
 * @param {ReturnType<typeof spin>} outcome Resolved spin result.
 * @returns {ReturnType<typeof spin>}
 */
function applyBoostToOutcome(outcome) {
  if (!state.boost || outcome.payout === 0) {
    return outcome;
  }

  const boostedPayout = outcome.payout * state.boost.multiplier;
  const originalPayout = outcome.payout;

  return {
    ...outcome,
    balance: outcome.balance + boostedPayout - originalPayout,
    payout: boostedPayout,
    totalMultiplier: outcome.totalMultiplier * state.boost.multiplier
  };
}

/**
 * Decrements boost duration after each completed spin.
 *
 * @returns {void}
 */
function consumeBoostSpin() {
  if (!state.boost) {
    return;
  }

  state.boost.spinsRemaining -= 1;
  if (state.boost.spinsRemaining <= 0) {
    state.boost = null;
  }

  renderBoostIndicator();
  renderShop();
}

/**
 * @returns {void}
 */
function renderPaytable() {
  const rows = Array.from(PAYTABLE.values())
    .sort((a, b) => b.multiplier - a.multiplier || b.count - a.count || a.symbol.localeCompare(b.symbol))
    .map((entry) => {
      const row = document.createElement("div");
      row.className = "paytable_row";

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
    piece.className = "confetti_piece";
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
  elements.paytableToggle.querySelector(".paytable_tab_icon").textContent = expanded ? "+" : "-";
}

/**
 * @returns {void}
 */
function renderShop() {
  const items = SHOP_ITEMS.map((item) => {
    const row = document.createElement("div");
    row.className = "shop_item";

    const copy = document.createElement("span");
    copy.textContent = `${item.label} · ${BOOST_SPIN_COUNT} spins · ${item.cost} tokens`;

    const button = document.createElement("button");
    button.className = "shop_buy_button";
    button.type = "button";
    button.textContent = "Buy";
    button.disabled = state.balance < item.cost || Boolean(state.boost) || state.spinning || state.autoSpinning;
    button.addEventListener("click", () => buyBoost(item));

    row.append(copy, button);
    return row;
  });

  elements.shopItems.replaceChildren(...items);
}

/**
 * @param {{ id: string, label: string, multiplier: number, cost: number }} item Shop boost.
 * @returns {void}
 */
function buyBoost(item) {
  if (state.balance < item.cost || state.boost || state.spinning || state.autoSpinning) {
    return;
  }

  state.balance -= item.cost;
  state.boost = {
    id: item.id,
    label: item.label,
    multiplier: item.multiplier,
    spinsRemaining: BOOST_SPIN_COUNT
  };

  renderBalance();
  renderBoostIndicator();
  renderShop();
  updateBetBounds();
  launchLightningBolt();
  setStatus(`${item.label} active for ${BOOST_SPIN_COUNT} spins.`, "ready");
}

/**
 * @returns {void}
 */
function renderBoostIndicator() {
  if (!state.boost) {
    elements.boostIndicator.hidden = true;
    elements.boostIndicator.textContent = "";
    return;
  }

  elements.boostIndicator.hidden = false;
  elements.boostIndicator.textContent = `◆ Payout boost active · ${state.boost.spinsRemaining}`;
}

/**
 * @returns {void}
 */
function openChestModal() {
  state.chestOpen = true;
  setControlsEnabled(false);
  elements.chestModal.hidden = false;
  renderChests();
}

/**
 * @returns {void}
 */
function renderChests() {
  const rewards = shuffleArray([...CHEST_REWARDS]);
  const chests = rewards.map((reward, index) => {
    const button = document.createElement("button");
    button.className = "chest_button";
    button.type = "button";
    button.innerHTML = `<span aria-hidden="true">🧰</span><strong>Chest ${index + 1}</strong>`;
    button.addEventListener("click", () => redeemChest(reward));
    return button;
  });

  elements.chestGrid.replaceChildren(...chests);
}

/**
 * @param {number} reward Token reward.
 * @returns {void}
 */
function redeemChest(reward) {
  state.balance = reward;
  elements.chestModal.hidden = true;
  renderBalance();
  updateBetBounds();
  renderShop();
  openRewardModal(reward);
}

/**
 * @param {number} reward Token reward.
 * @returns {void}
 */
function openRewardModal(reward) {
  elements.rewardAmount.textContent = `${reward} tokens`;
  elements.rewardModal.hidden = false;
  setStatus(reward > 0 ? `Chest redeemed: ${reward} tokens.` : "Empty chest. Better luck next time.", "ready");
}

/**
 * @returns {void}
 */
function closeRewardModal() {
  state.chestOpen = false;
  elements.rewardModal.hidden = true;
  setControlsEnabled(state.balance >= MIN_BET);
  updateBetBounds();
}

/**
 * @returns {void}
 */
function renderBalance() {
  elements.balance.textContent = String(state.balance);
}

/**
 * Shows a temporary balance without committing it to game state.
 *
 * @param {number} balance Temporary balance.
 * @returns {void}
 */
function setTemporaryBalance(balance) {
  elements.balance.textContent = String(balance);
}

/**
 * @param {string} message Status message.
 * @param {"ready" | "win" | "big" | "loss"} type Visual status type.
 * @returns {void}
 */
function setStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = `status status_${type}`;
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
  const typedBet = Number.parseInt(elements.bet.value, 10);

  elements.bet.min = "0";
  elements.bet.max = String(maxBet);
  if (elements.bet.value !== "" && !Number.isNaN(typedBet) && typedBet > maxBet) {
    elements.bet.value = String(maxBet);
  }
  elements.decreaseBet.disabled = controlsDisabled || getDisplayedBet() <= 0;
  elements.increaseBet.disabled = controlsDisabled || getDisplayedBet() >= maxBet;
}

/**
 * @returns {number}
 */
function getCurrentMaxBet() {
  return Math.max(MIN_BET, state.balance);
}

/**
 * @param {boolean} enabled Whether controls are enabled.
 * @returns {void}
 */
function setControlsEnabled(enabled) {
  state.controlsEnabled = enabled;
  elements.autoSpinButton.disabled = !enabled;
  elements.spinButton.disabled = !enabled;
  elements.bet.disabled = !enabled;
  updateBetBounds();
  renderShop();
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
 * Randomizes an array in place.
 *
 * @template T
 * @param {T[]} items Items to shuffle.
 * @returns {T[]}
 */
function shuffleArray(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

/**
 * @param {number} milliseconds Delay length.
 * @returns {Promise<void>}
 */
function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * @returns {void}
 */
function launchLightningBolt() {
  const overlay = document.createElement("div");
  overlay.className = "lightning_overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = '<div class="lightning_bolt">⚡</div><div class="lightning_text">BOOST ACTIVATED</div>';
  document.body.append(overlay);
  window.setTimeout(() => overlay.remove(), 1200);
}

/**
 * @returns {number}
 */
function getDisplayedBet() {
  const parsedBet = Number.parseInt(elements.bet.value, 10);
  return Number.isNaN(parsedBet) ? 0 : parsedBet;
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
