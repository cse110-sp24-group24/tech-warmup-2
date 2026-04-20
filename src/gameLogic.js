export const REEL_COUNT = 5;
export const ROW_COUNT = 3;
export const CENTER_ROW_INDEX = 1;
export const INITIAL_BALANCE = 100;
export const MIN_BET = 1;
export const MAX_BET = 10;
export const BIG_WIN_MULTIPLIER = 20;

export const SYMBOLS = Object.freeze(["7", "BAR", "GEM", "STAR", "ORB", "COMET"]);

const BASE_MULTIPLIERS = Object.freeze({
  "7": 10,
  BAR: 8,
  GEM: 6,
  STAR: 5,
  ORB: 4,
  COMET: 3
});

/**
 * Builds a structured paytable keyed by "SYMBOL:COUNT".
 *
 * @returns {Map<string, { symbol: string, count: number, multiplier: number, label: string }>}
 */
export function createPaytable() {
  const paytable = new Map();

  SYMBOLS.forEach((symbol) => {
    [3, 4, 5].forEach((count) => {
      const multiplier = BASE_MULTIPLIERS[symbol] * (count - 2);
      paytable.set(`${symbol}:${count}`, {
        symbol,
        count,
        multiplier,
        label: `${count} ${symbol}`
      });
    });
  });

  return paytable;
}

export const PAYTABLE = createPaytable();

/**
 * Returns a cryptographically backed random integer when available.
 *
 * @param {number} maxExclusive Upper bound, excluded.
 * @returns {number}
 */
export function getRandomInteger(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("maxExclusive must be a positive integer.");
  }

  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const maxUint = 0xffffffff;
    const limit = maxUint - (maxUint % maxExclusive);
    const values = new Uint32Array(1);

    do {
      cryptoApi.getRandomValues(values);
    } while (values[0] >= limit);

    return values[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

/**
 * Generates exactly five independent reels with three visible rows each.
 *
 * @param {(maxExclusive: number) => number} randomInteger Random integer source.
 * @returns {string[][]}
 */
export function generateSpinResult(randomInteger = getRandomInteger) {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => SYMBOLS[randomInteger(SYMBOLS.length)])
  );
}

/**
 * Extracts the single center payline from visible reels.
 *
 * @param {string[][]} reels Current visible reel symbols.
 * @returns {string[]}
 */
export function getCenterPayline(reels) {
  validateReels(reels);
  return reels.map((reel) => reel[CENTER_ROW_INDEX]);
}

/**
 * Evaluates left-to-right matches on the center row using the paytable.
 *
 * @param {string[]} payline Five center-row symbols.
 * @param {Map<string, { multiplier: number, label: string }>} paytable Paytable lookup.
 * @returns {{ key: string | null, multiplier: number, matchedCount: number, matchedSymbol: string | null, label: string }}
 */
export function evaluatePayline(payline, paytable = PAYTABLE) {
  if (!Array.isArray(payline) || payline.length !== REEL_COUNT) {
    throw new RangeError("Payline must contain exactly five symbols.");
  }

  const [firstSymbol] = payline;
  const matchedCount = payline.findIndex((symbol) => symbol !== firstSymbol);
  const count = matchedCount === -1 ? payline.length : matchedCount;
  const key = `${firstSymbol}:${count}`;
  const entry = paytable.get(key);

  return {
    key: entry ? key : null,
    multiplier: entry?.multiplier ?? 0,
    matchedCount: entry ? count : 0,
    matchedSymbol: entry ? firstSymbol : null,
    label: entry?.label ?? "No match"
  };
}

/**
 * Resolves a spin after deducting the bet immediately.
 *
 * @param {{ balance: number, bet: number, reels?: string[][], randomInteger?: (maxExclusive: number) => number }} options
 * @returns {{ balance: number, bet: number, reels: string[][], payline: string[], win: ReturnType<typeof evaluatePayline>, payout: number, gameOver: boolean }}
 */
export function spin(options) {
  const { balance, bet, reels = generateSpinResult(options.randomInteger) } = options;
  validateBet(bet, balance);

  const balanceAfterBet = Math.max(0, balance - bet);
  const payline = getCenterPayline(reels);
  const win = evaluatePayline(payline);
  const payout = bet * win.multiplier;
  const nextBalance = balanceAfterBet + payout;

  return {
    balance: nextBalance,
    bet,
    reels,
    payline,
    win,
    payout,
    gameOver: nextBalance < MIN_BET
  };
}

/**
 * Validates a player's requested bet.
 *
 * @param {number} bet Requested bet.
 * @param {number} balance Current balance.
 * @returns {void}
 */
export function validateBet(bet, balance) {
  if (!Number.isInteger(bet)) {
    throw new TypeError("Bet must be a whole number.");
  }

  if (bet < MIN_BET || bet > MAX_BET) {
    throw new RangeError(`Bet must be between ${MIN_BET} and ${MAX_BET}.`);
  }

  if (bet > balance) {
    throw new RangeError("Bet cannot exceed current balance.");
  }
}

/**
 * Ensures reel data keeps the required five-by-three shape.
 *
 * @param {string[][]} reels Reels to validate.
 * @returns {void}
 */
function validateReels(reels) {
  if (!Array.isArray(reels) || reels.length !== REEL_COUNT) {
    throw new RangeError("A spin must contain exactly five reels.");
  }

  reels.forEach((reel) => {
    if (!Array.isArray(reel) || reel.length !== ROW_COUNT) {
      throw new RangeError("Each reel must contain exactly three visible rows.");
    }
  });
}
