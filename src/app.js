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
const AUTO_SPIN_COUNT = 5;
const AUTO_SPIN_WIN_PAUSE_MS = 3000;
const BOOST_SPIN_COUNT = 5;
const FLAPPY_GRAVITY = 0.34;
const FLAPPY_FLAP_VELOCITY = -5.8;
const FLAPPY_PIPE_SPEED = 2.8;
const FLAPPY_PIPE_WIDTH = 72;
const FLAPPY_PIPE_GAP = 122;
const FLAPPY_PIPE_SPACING = 212;
const FLAPPY_BIRD_X_RATIO = 0.3;
const FLAPPY_BIRD_RADIUS = 11;
const CONFETTI_COLORS = Object.freeze(["#2ff8ff", "#ff3df2", "#9b5cff", "#ffd166", "#54ffad"]);
const CHEST_REWARDS = Object.freeze([50, 500, 0]);
const SHOP_ITEMS = Object.freeze([
  { id: "boost_2x", label: "2x Payout Boost", multiplier: 2, cost: 75 },
  { id: "boost_3x", label: "3x Payout Boost", multiplier: 3, cost: 180 },
  { id: "boost_4x", label: "4x Payout Boost", multiplier: 4, cost: 320 }
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
  bonusResultAmount: document.querySelector("#bonus_result_amount"),
  bonusResultContinueButton: document.querySelector("#bonus_result_continue_button"),
  bonusResultModal: document.querySelector("#bonus_result_modal"),
  bonusStartButton: document.querySelector("#bonus_start_button"),
  boostIndicator: document.querySelector("#boost_indicator"),
  boostIndicatorText: document.querySelector("#boost_indicator_text"),
  chestGrid: document.querySelector("#chest_grid"),
  chestModal: document.querySelector("#chest_modal"),
  controls: document.querySelector("#controls"),
  decreaseBet: document.querySelector("#decrease_bet"),
  flappyBonusTokens: document.querySelector("#flappy_bonus_tokens"),
  flappyCanvas: document.querySelector("#flappy_canvas"),
  flappyModal: document.querySelector("#flappy_modal"),
  flappyModalClose: document.querySelector("#flappy_modal_close"),
  flappyOpenButton: document.querySelector("#flappy_open_button"),
  flappyPrompt: document.querySelector("#flappy_prompt"),
  gameTitle: document.querySelector("#game_title"),
  increaseBet: document.querySelector("#increase_bet"),
  paytableList: document.querySelector("#paytable_list"),
  paytablePanel: document.querySelector("#paytable_panel"),
  paytableToggle: document.querySelector("#paytable_toggle"),
  reels: Array.from(document.querySelectorAll(".reel")),
  rewardAmount: document.querySelector("#reward_amount"),
  rewardContinueButton: document.querySelector("#reward_continue_button"),
  rewardModal: document.querySelector("#reward_modal"),
  stopButton: document.querySelector("#stop_button"),
  shopItems: document.querySelector("#shop_items"),
  shopModal: document.querySelector("#shop_modal"),
  shopModalClose: document.querySelector("#shop_modal_close"),
  shopToggle: document.querySelector("#shop_toggle"),
  themeToggle: document.querySelector("#theme_toggle"),
  musicToggle: document.querySelector("#music_toggle"),
  spinButton: document.querySelector("#spin_button"),
  status: document.querySelector("#status")
};

const background = new RetroSpaceBackground(document.querySelector("#space_background"));
const audio = createAudioFeedback();

const state = {
  autoSpinStopRequested: false,
  autoSpinning: false,
  balance: INITIAL_BALANCE,
  bonusGameActive: false,
  boost: null,
  chestOpen: false,
  controlsEnabled: true,
  darkMode: true,
  musicEnabled: true,
  spinning: false
};

renderPaytable();
renderShop();
renderBoostIndicator();
renderMusicToggle();
renderBalance();
updateBetBounds();
renderThemeToggle();
applyTheme(true);
background.start();

elements.controls.addEventListener("submit", handleSpin);
elements.autoSpinButton.addEventListener("click", handleAutoSpin);
elements.stopButton.addEventListener("click", handleStopAutoSpin);
elements.decreaseBet.addEventListener("click", () => adjustBet(-1));
elements.increaseBet.addEventListener("click", () => adjustBet(1));
elements.bet.addEventListener("input", updateBetBounds);
elements.paytableToggle.addEventListener("click", togglePaytable);
elements.flappyOpenButton.addEventListener("click", openFlappyModal);
elements.flappyModalClose.addEventListener("click", closeFlappyModal);
elements.bonusStartButton.addEventListener("click", startFlappyBonusRound);
elements.bonusResultContinueButton.addEventListener("click", closeBonusResultModal);
elements.rewardContinueButton.addEventListener("click", closeRewardModal);
elements.shopToggle.addEventListener("click", openShopModal);
elements.musicToggle.addEventListener("click", toggleMusic);
elements.themeToggle.addEventListener("click", toggleTheme);
elements.shopModalClose.addEventListener("click", closeShopModal);
elements.shopModal.addEventListener("click", (event) => {
  if (event.target === elements.shopModal) {
    closeShopModal();
  }
});
elements.flappyModal.addEventListener("click", (event) => {
  if (event.target === elements.flappyModal) {
    closeFlappyModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!elements.shopModal.hidden) {
    closeShopModal();
    return;
  }

  if (!elements.flappyModal.hidden) {
    closeFlappyModal();
    return;
  }

  if (!elements.bonusResultModal.hidden) {
    closeBonusResultModal();
  }
});

/**
 * Handles one complete spin, with the result computed before animation starts.
 *
 * @param {SubmitEvent} event Form submit event.
 * @returns {Promise<void>}
 */
async function handleSpin(event) {
  event.preventDefault();
  audio.ensureStarted();

  if (state.spinning || state.autoSpinning || state.chestOpen || state.bonusGameActive) {
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
  audio.ensureStarted();
  if (state.spinning || state.autoSpinning || state.chestOpen || state.bonusGameActive) {
    return;
  }

  const autoSpinBet = getSanitizedBet();
  const sessionStartBalance = state.balance;
  let completedSpins = 0;

  state.autoSpinStopRequested = false;
  state.autoSpinning = true;
  setControlsEnabled(false);
  setStatus("Auto spin...", "ready");

  try {
    for (let count = 0; count < AUTO_SPIN_COUNT && state.balance >= MIN_BET; count += 1) {
      const outcome = await runSpin({ bet: autoSpinBet, restoreControls: false, announceResult: false });

      if (!outcome) {
        break;
      }

      completedSpins += 1;

      if (state.chestOpen || state.balance < MIN_BET || state.autoSpinStopRequested) {
        break;
      }

      if (outcome.payout > 0) {
        await delay(AUTO_SPIN_WIN_PAUSE_MS);
      }
    }
  } finally {
    state.autoSpinning = false;
    const stopRequested = state.autoSpinStopRequested;
    state.autoSpinStopRequested = false;
    state.spinning = false;
    updateBetBounds();
    setControlsEnabled(state.balance >= MIN_BET && !state.chestOpen);

    const net = state.balance - sessionStartBalance;
    const spinWord = completedSpins === 1 ? "spin" : "spins";

    if (state.chestOpen && state.balance < MIN_BET) {
      setStatus(
        `Auto session - ${completedSpins} ${spinWord}, ${formatNetTokens(net)}. Pick a chest to continue.`,
        net > 0 ? "win" : net < 0 ? "loss" : "ready"
      );
    } else if (stopRequested) {
      setStatus(
        `Auto spin stopped - ${completedSpins} ${spinWord}, ${formatNetTokens(net)}.`,
        net > 0 ? "win" : net < 0 ? "loss" : "ready"
      );
    } else if (completedSpins > 0) {
      setStatus(
        `Auto session - ${completedSpins} ${spinWord}, ${formatNetTokens(net)}.`,
        net > 0 ? "win" : net < 0 ? "loss" : "ready"
      );
    } else if (!state.chestOpen) {
      setStatus("Auto spin did not run - need enough tokens for your current bet.", "ready");
    }
  }
}

/**

 * Requests auto-spin to stop after the current spin finishes.
 *
 * @returns {void}
 */
function handleStopAutoSpin() {
  if (!state.autoSpinning) {
    return;
  }

  state.autoSpinStopRequested = true;
  setStatus("Stopping auto spin after current spin...", "ready");
}

/**

 * @param {number} delta End balance minus start balance for a session.
 * @returns {string}
 */
function formatNetTokens(delta) {
  if (delta > 0) {
    return `up ${delta} tokens`;
  }

  if (delta < 0) {
    return `down ${-delta} tokens`;
  }

  return "no net change";
}

/**
 * Clamps a requested bet to legal integer bounds for the current balance.
 *
 * @param {number} rawBet Requested bet (may be from input or auto-spin).
 * @param {number} balance Balance before the spin.
 * @returns {number}
 */
function resolveSpinBet(rawBet, balance) {
  const affordableMax = Math.min(MAX_BET, balance);
  const upper = Math.max(MIN_BET, affordableMax);
  const parsed = Number.isInteger(rawBet) ? rawBet : Math.trunc(Number(rawBet));
  if (!Number.isFinite(parsed)) {
    throw new RangeError("Bet must be a whole number.");
  }

  return clamp(parsed, MIN_BET, upper);
}

/**
 * Opens the shop modal when gameplay allows it.
 *
 * @returns {void}
 */
function openShopModal() {
  if (state.chestOpen || state.spinning || state.autoSpinning || state.bonusGameActive || !elements.flappyModal.hidden) {
    return;
  }

  elements.shopModal.hidden = false;
  document.body.style.overflow = "hidden";
  renderShop();
  elements.shopModalClose.focus();
}

/**
 * Closes the shop modal and restores page scroll.
 *
 * @returns {void}
 */
function closeShopModal() {
  elements.shopModal.hidden = true;
  if (elements.flappyModal.hidden) {
    document.body.style.overflow = "";
  }
}

/**
 * Runs one spin while keeping spin() as the permanent balance authority.
 *
 * @param {{ bet?: number, announceResult?: boolean, restoreControls?: boolean }} [options] Spin behavior.
 * @returns {Promise<ReturnType<typeof spin> | undefined>}
 */
async function runSpin({ bet: requestedBet, announceResult = true, restoreControls = true } = {}) {
  if (state.spinning) {
    return undefined;
  }

  const startingBalance = state.balance;
  const bet = requestedBet ?? getSanitizedBet();
  let outcome;
  /** Set once spin() and boost math succeed; used to distinguish rollback from a settled loss. */
  let ledgerOutcome = null;

  state.spinning = true;
  setControlsEnabled(false);

  try {
    const resolvedBet = resolveSpinBet(bet, startingBalance);
    outcome = spin({ balance: startingBalance, bet: resolvedBet });
    ledgerOutcome = outcome;
    outcome = applyBoostToOutcome(outcome);
    ledgerOutcome = outcome;
    clearWinningCells();
    setTemporaryBalance(Math.max(0, startingBalance - resolvedBet));
    setStatus("Spinning...", "ready");
    audio.playSpin();

    await animateReels(outcome.reels);

    state.balance = outcome.balance;
    if (announceResult) {
      announceOutcome(outcome);
    }
    highlightWinningCells(outcome.wins);
    consumeBoostSpin();
    return outcome;
  } catch (error) {
    state.balance = ledgerOutcome !== null ? ledgerOutcome.balance : startingBalance;
    if (announceResult && !state.autoSpinning) {
      setStatus(error.message, "loss");
    }
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
    setStatus(`No match. Lost ${outcome.bet} tokens.`, "loss");
    return;
  }

  const isBigWin = outcome.totalMultiplier >= BIG_WIN_MULTIPLIER;
  const statusType = isBigWin ? "big" : "win";
  const comboText = outcome.wins.length === 1 ? "1 combo" : `${outcome.wins.length} combos`;

  audio.playWinFx();
  audio.playWinTriumph();

  if (isBigWin) {
    background.triggerWarp();
    audio.playBigWin();
  }

  background.triggerFireworks();
  launchConfetti();
  if (isBigWin) {
    window.setTimeout(() => launchConfetti(), 260);
  }
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
function openFlappyModal() {
  if (state.chestOpen || state.spinning || state.autoSpinning || state.bonusGameActive) {
    return;
  }

  closeShopModal();
  elements.flappyModal.hidden = false;
  document.body.style.overflow = "hidden";
  elements.flappyModalClose.focus();
}

/**
 * @returns {void}
 */
function closeFlappyModal() {
  if (state.bonusGameActive) {
    return;
  }

  elements.flappyModal.hidden = true;
  document.body.style.overflow = "";
}

/**
 * @returns {void}
 */
function toggleTheme() {
  applyTheme(!state.darkMode);
  renderThemeToggle();
}

/**
 * @returns {void}
 */
function renderThemeToggle() {
  elements.themeToggle.setAttribute("aria-pressed", String(!state.darkMode));
  elements.themeToggle.textContent = state.darkMode ? "Theme: Dark" : "Theme: Light";
}

/**
 * @param {boolean} darkMode Whether dark mode is active.
 * @returns {void}
 */
function applyTheme(darkMode) {
  state.darkMode = darkMode;
  document.body.classList.toggle("theme-light", !darkMode);
  elements.gameTitle.textContent = darkMode ? "Space and Beyond" : "Miami Vice";
  background.setTheme(darkMode ? "dark" : "light");
}

/**
 * @returns {Promise<void>}
 */
async function startFlappyBonusRound() {
  if (state.spinning || state.autoSpinning || state.chestOpen || state.bonusGameActive) {
    return;
  }

  closeShopModal();
  openFlappyModal();
  state.bonusGameActive = true;
  setControlsEnabled(false);
  elements.flappyBonusTokens.textContent = "0";
  elements.flappyPrompt.textContent = "Press Space to Start";
  setStatus("FLAPPY BLOB active.", "ready");

  let earnedTokens = 0;
  try {
    earnedTokens = await runFlappyBonusRound();
    state.balance += earnedTokens;
  } finally {
    state.bonusGameActive = false;
    renderBalance();
    updateBetBounds();
    renderShop();
    setControlsEnabled(state.balance >= MIN_BET && !state.chestOpen);
    closeFlappyModal();
  }

  openBonusResultModal(earnedTokens);
  if (earnedTokens > 0) {
    setStatus(`FLAPPY BLOB complete. Earned ${earnedTokens} tokens.`, "win");
  } else {
    setStatus("FLAPPY BLOB complete. No bonus tokens earned.", "loss");
  }
}

/**
 * @param {number} earnedTokens Token reward from bonus run.
 * @returns {void}
 */
function openBonusResultModal(earnedTokens) {
  elements.bonusResultAmount.textContent = `${earnedTokens} tokens`;
  elements.bonusResultModal.hidden = false;
}

/**
 * @returns {void}
 */
function closeBonusResultModal() {
  elements.bonusResultModal.hidden = true;
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
    button.disabled =
      state.balance < item.cost ||
      Boolean(state.boost) ||
      state.spinning ||
      state.autoSpinning ||
      state.bonusGameActive ||
      state.chestOpen;
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
  if (state.balance < item.cost || state.boost || state.spinning || state.autoSpinning || state.chestOpen || state.bonusGameActive) {
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
    elements.boostIndicatorText.textContent = "";
    return;
  }

  elements.boostIndicator.hidden = false;
  elements.boostIndicatorText.textContent = `Payout boost active · ${state.boost.spinsRemaining} spins left`;
}

/**
 * @returns {void}
 */
function toggleMusic() {
  audio.ensureStarted();
  state.musicEnabled = !state.musicEnabled;
  audio.setEnabled(state.musicEnabled);
  renderMusicToggle();
}

/**
 * @returns {void}
 */
function renderMusicToggle() {
  elements.musicToggle.setAttribute("aria-pressed", String(state.musicEnabled));
  elements.musicToggle.textContent = state.musicEnabled ? "Music: On" : "Music: Off";
}

/**
 * @returns {void}
 */
function openChestModal() {
  closeShopModal();
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
  const maxBet = getCurrentMaxBet();
  elements.bet.value = String(clamp(currentBet + delta, MIN_BET, maxBet));
  updateBetBounds();
}

/**
 * @returns {number}
 */
function getSanitizedBet() {
  const maxBet = getCurrentMaxBet();
  const parsedBet = Number.parseInt(elements.bet.value, 10);
  const base = Number.isNaN(parsedBet) ? MIN_BET : parsedBet;
  return clamp(base, MIN_BET, maxBet);
}

/**
 * @returns {void}
 */
function updateBetBounds() {
  const maxBet = getCurrentMaxBet();
  const controlsDisabled = state.spinning || !state.controlsEnabled;
  const typedBet = Number.parseInt(elements.bet.value, 10);

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
  return Math.min(MAX_BET, Math.max(MIN_BET, state.balance));
}

/**
 * @param {boolean} enabled Whether controls are enabled.
 * @returns {void}
 */
function setControlsEnabled(enabled) {
  state.controlsEnabled = enabled;
  const controlsLocked = state.chestOpen || state.bonusGameActive;
  const nextEnabled = enabled && !controlsLocked;
  elements.autoSpinButton.disabled = !nextEnabled;
  elements.spinButton.disabled = !nextEnabled;
  elements.stopButton.disabled = !state.autoSpinning;
  elements.bet.disabled = !nextEnabled;
  elements.shopToggle.disabled = !nextEnabled;
  elements.musicToggle.disabled = false;
  elements.flappyOpenButton.disabled = !nextEnabled;
  elements.bonusStartButton.disabled = controlsLocked || state.spinning || state.autoSpinning;
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

function runFlappyBonusRound() {
  const canvas = elements.flappyCanvas;
  const context = canvas.getContext("2d");
  if (!context) {
    return Promise.resolve(0);
  }

  const width = canvas.width;
  const height = canvas.height;
  const birdX = width * FLAPPY_BIRD_X_RATIO;
  const floorHeight = 20;
  const minGapY = 54;
  const maxGapY = height - floorHeight - 54 - FLAPPY_PIPE_GAP;
  const glowColor = "rgba(47, 248, 255, 0.85)";
  const pipeColor = "rgba(84, 255, 173, 0.95)";
  const dangerColor = "rgba(255, 94, 122, 0.92)";
  let birdY = height * 0.45;
  let birdVelocity = 0;
  let score = 0;
  let frameHandle = 0;
  let watcherHandle = 0;
  let ended = false;
  let gameStarted = false;
  let spawnAccumulator = 0;
  let finalizeRound = () => {};
  /** @type {Array<{ x: number, gapTop: number, scored: boolean }>} */
  let pipes = [];

  const flap = () => {
    birdVelocity = FLAPPY_FLAP_VELOCITY;
  };

  const onCanvasPointerDown = (event) => {
    event.preventDefault();
    if (!gameStarted) {
      return;
    }
    flap();
  };

  const onWindowKeyDown = (event) => {
    if (!state.bonusGameActive || event.code !== "Space") {
      return;
    }
    event.preventDefault();

    if (!gameStarted) {
      startGame();
      flap();
      return;
    }

    flap();
  };

  /**
   * @returns {void}
   */
  function cleanupListeners() {
    canvas.removeEventListener("pointerdown", onCanvasPointerDown);
    window.removeEventListener("keydown", onWindowKeyDown);
  }

  /**
   * @returns {void}
   */
  function spawnPipe() {
    const gapTop = minGapY + Math.random() * Math.max(1, maxGapY - minGapY);
    pipes.push({
      x: width + FLAPPY_PIPE_WIDTH,
      gapTop,
      scored: false
    });
  }

  /**
   * @returns {void}
   */
  function drawFrame() {
    context.clearRect(0, 0, width, height);

    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "rgba(74, 168, 255, 0.2)");
    sky.addColorStop(1, "rgba(12, 6, 28, 0.85)");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(255, 209, 102, 0.2)";
    context.fillRect(0, height - floorHeight, width, floorHeight);

    pipes.forEach((pipe) => {
      context.fillStyle = pipeColor;
      context.fillRect(pipe.x, 0, FLAPPY_PIPE_WIDTH, pipe.gapTop);
      context.fillRect(
        pipe.x,
        pipe.gapTop + FLAPPY_PIPE_GAP,
        FLAPPY_PIPE_WIDTH,
        height - floorHeight - (pipe.gapTop + FLAPPY_PIPE_GAP)
      );
    });

    context.beginPath();
    context.arc(birdX, birdY, FLAPPY_BIRD_RADIUS, 0, Math.PI * 2);
    context.fillStyle = dangerColor;
    context.shadowColor = glowColor;
    context.shadowBlur = 12;
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(248, 251, 255, 0.92)";
    context.font = "bold 20px 'Courier New', monospace";
    context.fillText(`Bonus: ${score}`, 14, 28);

    if (!gameStarted) {
      context.fillStyle = "rgba(248, 251, 255, 0.96)";
      context.font = "bold 30px 'Courier New', monospace";
      context.textAlign = "center";
      context.fillText("PRESS SPACE TO START", width / 2, height * 0.52);
      context.textAlign = "start";
    }
  }

  /**
   * @returns {boolean}
   */
  function collides() {
    if (birdY - FLAPPY_BIRD_RADIUS <= 0 || birdY + FLAPPY_BIRD_RADIUS >= height - floorHeight) {
      return true;
    }

    return pipes.some((pipe) => {
      const insidePipeX = birdX + FLAPPY_BIRD_RADIUS > pipe.x && birdX - FLAPPY_BIRD_RADIUS < pipe.x + FLAPPY_PIPE_WIDTH;
      if (!insidePipeX) {
        return false;
      }

      const aboveGap = birdY - FLAPPY_BIRD_RADIUS < pipe.gapTop;
      const belowGap = birdY + FLAPPY_BIRD_RADIUS > pipe.gapTop + FLAPPY_PIPE_GAP;
      return aboveGap || belowGap;
    });
  }

  /**
   * @returns {void}
   */
  function step() {
    birdVelocity += FLAPPY_GRAVITY;
    birdY += birdVelocity;

    spawnAccumulator += FLAPPY_PIPE_SPEED;
    if (spawnAccumulator >= FLAPPY_PIPE_SPACING) {
      spawnAccumulator = 0;
      spawnPipe();
    }

    pipes = pipes
      .map((pipe) => ({ ...pipe, x: pipe.x - FLAPPY_PIPE_SPEED }))
      .filter((pipe) => pipe.x + FLAPPY_PIPE_WIDTH > -2);

    pipes.forEach((pipe) => {
      if (!pipe.scored && pipe.x + FLAPPY_PIPE_WIDTH < birdX - FLAPPY_BIRD_RADIUS) {
        pipe.scored = true;
        score += 1;
        elements.flappyBonusTokens.textContent = String(score);
      }
    });

    drawFrame();
  }

  /**
   * @param {(score: number) => void} resolve Resolves with earned tokens.
   * @returns {void}
   */
  function finish(resolve) {
    if (ended) {
      return;
    }

    ended = true;
    if (watcherHandle) {
      window.clearInterval(watcherHandle);
    }
    window.cancelAnimationFrame(frameHandle);
    cleanupListeners();
    resolve(score);
  }

  /**
   * @returns {void}
   */
  function gameLoop() {
    if (ended || !state.bonusGameActive) {
      finalizeRound();
      return;
    }

    step();
    if (collides()) {
      finalizeRound();
      return;
    }

    frameHandle = window.requestAnimationFrame(gameLoop);
  }

  /**
   * @returns {void}
   */
  function startGame() {
    if (gameStarted || ended || !state.bonusGameActive) {
      return;
    }

    gameStarted = true;
    elements.flappyPrompt.textContent = "Space or click to flap";
    spawnPipe();
    frameHandle = window.requestAnimationFrame(gameLoop);
  }

  drawFrame();
  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  window.addEventListener("keydown", onWindowKeyDown);

  return new Promise((resolve) => {
    finalizeRound = () => finish(resolve);
    watcherHandle = window.setInterval(() => {
      if (!state.bonusGameActive && !ended) {
        finalizeRound();
      }
    }, 80);
  });
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
 * Creates compact Web Audio cues for wins, losses, and big wins.
 *
 * @returns {{
 *  ensureStarted: () => void,
 *  setEnabled: (enabled: boolean) => void,
 *  playHooray: () => void,
 *  playLoss: () => void,
 *  playBigWin: () => void,
 *  playSpin: () => void,
 *  playWinFx: () => void,
 *  playWinTriumph: () => void
 * }}
 */
function createAudioFeedback() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let context;
  let masterGain;
  let masterConnected = false;
  let musicStarted = false;
  let enabled = true;
  const MUSIC_STEP_SECONDS = 0.24;
  const MUSIC_ARP_SEQUENCE = Object.freeze([
    261.63, 392.0, 523.25, 783.99,
    293.66, 440.0, 587.33, 880.0,
    329.63, 493.88, 659.25, 987.77,
    293.66, 440.0, 587.33, 783.99
  ]);
  const MUSIC_BASS_SEQUENCE = Object.freeze([
    130.81, 146.83, 164.81, 146.83
  ]);

  /**
   * @returns {AudioContext | null}
   */
  function getContext() {
    if (!AudioContext) {
      return null;
    }

    context ??= new AudioContext();
    masterGain ??= context.createGain();
    masterGain.gain.setValueAtTime(enabled ? 1 : 0, context.currentTime);
    if (!masterConnected) {
      masterGain.connect(context.destination);
      masterConnected = true;
    }
    return context;
  }

  /**
   * @param {number[]} frequencies Tone frequencies.
   * @param {number} duration Tone duration in seconds.
   * @param {OscillatorType} type Oscillator type.
   * @param {number} gainPeak Peak gain for the envelope.
   * @returns {void}
   */
  function play(frequencies, duration, type, gainPeak = 0.08) {
    const activeContext = getContext();
    if (!activeContext) {
      return;
    }

    try {
      if (activeContext.state !== "running") {
        return;
      }

      frequencies.forEach((frequency, index) => {
        const oscillator = activeContext.createOscillator();
        const gain = activeContext.createGain();
        const start = activeContext.currentTime + index * duration * 0.82;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain).connect(masterGain);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      });
    } catch {
      // Audio should never block gameplay.
    }
  }

  /**
   * Plays a short sci-fi frequency sweep.
   *
   * @param {number} fromFrequency Start frequency.
   * @param {number} toFrequency End frequency.
   * @param {number} duration Sweep duration in seconds.
   * @param {OscillatorType} type Oscillator type.
   * @param {number} gainPeak Peak gain for the envelope.
   * @returns {void}
   */
  function playSweep(fromFrequency, toFrequency, duration, type = "sawtooth", gainPeak = 0.06) {
    const activeContext = getContext();
    if (!activeContext) {
      return;
    }

    try {
      if (activeContext.state !== "running") {
        return;
      }

      const oscillator = activeContext.createOscillator();
      const gain = activeContext.createGain();
      const start = activeContext.currentTime;
      const end = start + duration;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(fromFrequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(toFrequency, end);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      oscillator.connect(gain).connect(masterGain);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
    } catch {
      // Audio should never block gameplay.
    }
  }

  /**
   * Starts a gentle looping tune after the first user interaction.
   *
   * @returns {void}
   */
  function ensureStarted() {
    const activeContext = getContext();
    if (!activeContext || musicStarted) {
      return;
    }

    try {
      if (activeContext.state === "suspended") {
        activeContext.resume().catch(() => {});
      }

      musicStarted = true;
      const cycleLengthMs = MUSIC_ARP_SEQUENCE.length * MUSIC_STEP_SECONDS * 1000;

      const scheduleCycle = () => {
        if (activeContext.state !== "running") {
          return;
        }

        const cycleStart = activeContext.currentTime + 0.04;
        MUSIC_ARP_SEQUENCE.forEach((frequency, stepIndex) => {
          const start = cycleStart + stepIndex * MUSIC_STEP_SECONDS;
          const end = start + MUSIC_STEP_SECONDS;
          const arpOsc = activeContext.createOscillator();
          const arpGain = activeContext.createGain();
          arpOsc.type = "square";
          arpOsc.frequency.setValueAtTime(frequency, start);
          arpGain.gain.setValueAtTime(0.001, start);
          arpGain.gain.exponentialRampToValueAtTime(0.038, start + 0.025);
          arpGain.gain.exponentialRampToValueAtTime(0.001, end);
          arpOsc.connect(arpGain).connect(masterGain);
          arpOsc.start(start);
          arpOsc.stop(end + 0.01);
        });

        MUSIC_BASS_SEQUENCE.forEach((frequency, stepIndex) => {
          const start = cycleStart + stepIndex * MUSIC_STEP_SECONDS * 4;
          const end = start + MUSIC_STEP_SECONDS * 4;
          const bassOsc = activeContext.createOscillator();
          const bassGain = activeContext.createGain();
          bassOsc.type = "sine";
          bassOsc.frequency.setValueAtTime(frequency, start);
          bassGain.gain.setValueAtTime(0.001, start);
          bassGain.gain.exponentialRampToValueAtTime(0.028, start + 0.06);
          bassGain.gain.exponentialRampToValueAtTime(0.001, end);
          bassOsc.connect(bassGain).connect(masterGain);
          bassOsc.start(start);
          bassOsc.stop(end + 0.01);
        });
      };

      scheduleCycle();
      window.setInterval(scheduleCycle, cycleLengthMs);
    } catch {
      // Audio should never block gameplay.
      musicStarted = false;
    }
  }

  return {
    ensureStarted,
    setEnabled: (nextEnabled) => {
      enabled = Boolean(nextEnabled);
      const activeContext = getContext();
      if (!activeContext) {
        return;
      }

      masterGain.gain.setValueAtTime(enabled ? 1 : 0, activeContext.currentTime);
    },
    playHooray: () => play([523, 659, 784, 1046], 0.12, "square"),
    playLoss: () => play([220, 146], 0.16, "sawtooth"),
    playBigWin: () => play([392, 523, 659, 784, 1046, 1174], 0.13, "square", 0.1),
    playSpin: () => play([220, 260, 300, 340, 380], 0.09, "sawtooth", 0.05),
    playWinFx: () => playSweep(420, 1320, 0.22, "sawtooth", 0.065),
    playWinTriumph: () => play([523, 659, 784, 1046, 1318], 0.14, "triangle", 0.095)
  };
}

["pointerdown", "keydown"].forEach((eventName) => {
  window.addEventListener(
    eventName,
    () => {
      audio.ensureStarted();
    },
    { once: true }
  );
});
