export const REEL_COUNT = 5;
export const ROW_COUNT = 3;
export const INITIAL_BALANCE = 100;
export const MIN_BET = 1;
export const MAX_BET = Number.MAX_SAFE_INTEGER;
export const BIG_WIN_MULTIPLIER = 12;

export const SYMBOLS = Object.freeze(["7", "BAR", "GEM", "STAR", "ORB", "COMET"]);

export const LEGAL_PATHS = Object.freeze(createLegalWinPaths());

const BASE_MULTIPLIERS = Object.freeze({
  "7": 6,
  BAR: 5,
  GEM: 4,
  STAR: 3,
  ORB: 2,
  COMET: 2
});

/**
 * Builds a structured paytable keyed by "SYMBOL:COUNT".
 *
 * @returns {Map<string, { symbol: string, count: number, multiplier: number, label: string }>}
 */
export function createPaytable() {
  const paytable = new Map();

  SYMBOLS.forEach((symbol) => {
    [4, 5].forEach((count) => {
      const multiplier = BASE_MULTIPLIERS[symbol] * (count - 3);
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
 * Extracts one payline from visible reels.
 *
 * @param {string[][]} reels Current visible reel symbols.
 * @param {number[]} rowPattern Row index for each reel.
 * @returns {string[]}
 */
export function getPayline(reels, rowPattern) {
  validateReels(reels);
  validateRowPattern(rowPattern);
  return reels.map((reel, reelIndex) => reel[rowPattern[reelIndex]]);
}

/**
 * Evaluates matching symbols within one adjacent-row path.
 *
 * @param {string[]} payline Payline symbols.
 * @param {Map<string, { multiplier: number, label: string }>} paytable Paytable lookup.
 * @returns {{ key: string | null, multiplier: number, matchedCount: number, matchedSymbol: string | null, label: string }}
 */
export function evaluatePayline(payline, paytable = PAYTABLE) {
  if (!Array.isArray(payline) || payline.length < 4 || payline.length > REEL_COUNT) {
    throw new RangeError("Payline must contain four or five symbols.");
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
 * Evaluates every legal adjacent-row path and totals the multipliers.
 *
 * @param {string[][]} reels Current visible reel symbols.
 * @param {ReadonlyArray<{ startReel: number, rows: readonly number[] }>} legalPaths Legal win paths.
 * @param {Map<string, { multiplier: number, label: string }>} paytable Paytable lookup.
 * @returns {{ wins: Array<ReturnType<typeof evaluatePayline> & { pathName: string, path: number[], payline: string[], cells: Array<{ reelIndex: number, rowIndex: number }> }>, totalMultiplier: number }}
 */
export function evaluateReels(reels, legalPaths = LEGAL_PATHS, paytable = PAYTABLE) {
  validateReels(reels);

  const winsByPath = new Map();

  legalPaths.forEach((pathDefinition) => {
    const payline = getPathSymbols(reels, pathDefinition);
    const win = evaluatePayline(payline, paytable);

    if (win.multiplier === 0) {
      return;
    }

    const cells = pathDefinition.rows.slice(0, win.matchedCount).map((rowIndex, index) => ({
      reelIndex: pathDefinition.startReel + index,
      rowIndex
    }));
    const key = `${win.matchedSymbol}:${cells.map((cell) => `${cell.reelIndex}-${cell.rowIndex}`).join("|")}`;

    winsByPath.set(key, {
      ...win,
      pathName: cells.map((cell) => `${cell.rowIndex + 1}`).join("-"),
      path: [...pathDefinition.rows],
      payline,
      cells
    });
  });

  const wins = removeShorterContainedWins(Array.from(winsByPath.values()));

  return {
    wins,
    totalMultiplier: wins.reduce((total, win) => total + win.multiplier, 0)
  };
}

/**
 * Resolves a 3-by-5 spin after deducting the bet immediately.
 *
 * @param {{ balance?: number, bet?: number, reels?: string[][], randomInteger?: (maxExclusive: number) => number }} [options]
 * @returns {{ balance: number, bet: number, reels: string[][], wins: ReturnType<typeof evaluateReels>["wins"], totalMultiplier: number, payout: number, gameOver: boolean }}
 */
export function spin(options = {}) {
  const {
    balance = INITIAL_BALANCE,
    bet = MIN_BET,
    randomInteger,
    reels = generateSpinResult(randomInteger)
  } = options;
  validateBet(bet, balance);

  const balanceAfterBet = Math.max(0, balance - bet);
  const evaluation = evaluateReels(reels);
  const payout = bet * evaluation.totalMultiplier;
  const nextBalance = balanceAfterBet + payout;

  return {
    balance: nextBalance,
    bet,
    reels,
    wins: evaluation.wins,
    totalMultiplier: evaluation.totalMultiplier,
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

    reel.forEach((symbol) => {
      if (!SYMBOLS.includes(symbol)) {
        throw new RangeError(`Unknown reel symbol: ${symbol}`);
      }
    });
  });
}

/**
 * Ensures a payline row pattern covers all reels and valid rows.
 *
 * @param {readonly number[]} rowPattern Row index for each reel.
 * @returns {void}
 */
function validateRowPattern(rowPattern) {
  if (!Array.isArray(rowPattern) || rowPattern.length !== REEL_COUNT) {
    throw new RangeError("A payline must define one row for each reel.");
  }

  rowPattern.forEach((rowIndex) => {
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= ROW_COUNT) {
      throw new RangeError("Payline rows must be valid visible row indexes.");
    }
  });
}

/**
 * Extracts symbols for a shorter legal win path that may begin on any reel.
 *
 * @param {string[][]} reels Current visible reel symbols.
 * @param {{ startReel: number, rows: readonly number[] }} pathDefinition Legal win path.
 * @returns {string[]}
 */
function getPathSymbols(reels, pathDefinition) {
  return pathDefinition.rows.map((rowIndex, index) => reels[pathDefinition.startReel + index][rowIndex]);
}

/**
 * Removes shorter wins when the exact same symbol path is contained inside a longer one.
 *
 * @param {Array<ReturnType<typeof evaluatePayline> & { cells: Array<{ reelIndex: number, rowIndex: number }> }>} wins Wins to filter.
 * @returns {Array<ReturnType<typeof evaluatePayline> & { cells: Array<{ reelIndex: number, rowIndex: number }> }>}
 */
function removeShorterContainedWins(wins) {
  return wins.filter(
    (win) =>
      !wins.some(
        (otherWin) =>
          otherWin.matchedSymbol === win.matchedSymbol &&
          otherWin.cells.length > win.cells.length &&
          isCellRunContained(win.cells, otherWin.cells)
      )
  );
}

/**
 * @param {Array<{ reelIndex: number, rowIndex: number }>} shorter Candidate contained run.
 * @param {Array<{ reelIndex: number, rowIndex: number }>} longer Candidate longer path.
 * @returns {boolean}
 */
function isCellRunContained(shorter, longer) {
  const maxStartIndex = longer.length - shorter.length;

  for (let startIndex = 0; startIndex <= maxStartIndex; startIndex += 1) {
    const contained = shorter.every((cell, index) => {
      const longerCell = longer[startIndex + index];
      return cell.reelIndex === longerCell.reelIndex && cell.rowIndex === longerCell.rowIndex;
    });

    if (contained) {
      return true;
    }
  }

  return false;
}

/**
 * Builds every legal 4 and 5-reel win path. Each path may begin on any
 * reel and neighboring reels stay on the same row or move one row up/down.
 *
 * @returns {Array<{ startReel: number, rows: readonly number[] }>}
 */
function createLegalWinPaths() {
  const paths = [];

  for (let length = 4; length <= REEL_COUNT; length += 1) {
    for (let startReel = 0; startReel <= REEL_COUNT - length; startReel += 1) {
      for (let startRow = 0; startRow < ROW_COUNT; startRow += 1) {
        extendPath(startReel, length, [startRow]);
      }
    }
  }

  return paths.map((path) => Object.freeze({ startReel: path.startReel, rows: Object.freeze(path.rows) }));

  /**
   * @param {number} startReel First reel in the path.
   * @param {number} length Path length.
   * @param {number[]} path Partial row path.
   * @returns {void}
   */
  function extendPath(startReel, length, path) {
    if (path.length === length) {
      paths.push({ startReel, rows: path });
      return;
    }

    const previousRow = path[path.length - 1];
    for (let nextRow = previousRow - 1; nextRow <= previousRow + 1; nextRow += 1) {
      if (nextRow >= 0 && nextRow < ROW_COUNT) {
        extendPath(startReel, length, [...path, nextRow]);
      }
    }
  }
}
