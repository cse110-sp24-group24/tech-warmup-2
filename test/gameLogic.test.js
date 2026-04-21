import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_PATHS,
  MAX_BET,
  MIN_BET,
  PAYTABLE,
  REEL_COUNT,
  ROW_COUNT,
  evaluatePayline,
  evaluateReels,
  generateSpinResult,
  getPayline,
  spin,
  validateBet
} from "../src/gameLogic.js";

test("generateSpinResult creates exactly five independent reels with three rows", () => {
  let next = 0;
  const result = generateSpinResult((maxExclusive) => {
    const value = next % maxExclusive;
    next += 1;
    return value;
  });

  assert.equal(result.length, REEL_COUNT);
  result.forEach((reel) => assert.equal(reel.length, ROW_COUNT));
});

test("getPayline extracts any configured row pattern from the 3-by-5 grid", () => {
  const reels = [
    ["7", "BAR", "GEM"],
    ["STAR", "BAR", "ORB"],
    ["COMET", "BAR", "7"],
    ["GEM", "BAR", "STAR"],
    ["ORB", "BAR", "COMET"]
  ];

  assert.deepEqual(getPayline(reels, [0, 1, 2, 1, 0]), ["7", "BAR", "7", "BAR", "ORB"]);
});

test("evaluatePayline uses the paytable for four and five matching symbols", () => {
  const win = evaluatePayline(["GEM", "GEM", "GEM", "GEM", "STAR"]);
  const expectedEntry = PAYTABLE.get("GEM:4");

  assert.equal(win.key, "GEM:4");
  assert.equal(win.multiplier, expectedEntry.multiplier);
});

test("evaluatePayline returns no match for fewer than four matches", () => {
  const win = evaluatePayline(["ORB", "ORB", "ORB", "COMET"]);

  assert.equal(win.multiplier, 0);
  assert.equal(win.key, null);
});

test("evaluateReels totals multiple winning paths", () => {
  const reels = [
    ["7", "BAR", "COMET"],
    ["7", "BAR", "STAR"],
    ["7", "BAR", "ORB"],
    ["7", "BAR", "7"],
    ["ORB", "BAR", "GEM"]
  ];
  const evaluation = evaluateReels(reels, [
    { startReel: 0, rows: [0, 0, 0, 0] },
    { startReel: 0, rows: [1, 1, 1, 1, 1] }
  ]);

  assert.equal(evaluation.wins.length, 2);
  assert.equal(evaluation.totalMultiplier, PAYTABLE.get("7:4").multiplier + PAYTABLE.get("BAR:5").multiplier);
});

test("evaluateReels pays same-symbol paths across adjacent rows without requiring fixed shapes", () => {
  const reels = [
    ["STAR", "GEM", "COMET"],
    ["7", "STAR", "COMET"],
    ["7", "GEM", "STAR"],
    ["GEM", "COMET", "STAR"],
    ["ORB", "STAR", "7"]
  ];
  const evaluation = evaluateReels(reels, [{ startReel: 0, rows: [0, 1, 2, 2, 1] }]);

  assert.equal(evaluation.wins.length, 1);
  assert.equal(evaluation.wins[0].matchedSymbol, "STAR");
  assert.deepEqual(evaluation.wins[0].cells, [
    { reelIndex: 0, rowIndex: 0 },
    { reelIndex: 1, rowIndex: 1 },
    { reelIndex: 2, rowIndex: 2 },
    { reelIndex: 3, rowIndex: 2 },
    { reelIndex: 4, rowIndex: 1 }
  ]);
});

test("evaluateReels ignores shorter prefix wins when the same path reaches farther right", () => {
  const reels = [
    ["STAR", "GEM", "COMET"],
    ["STAR", "7", "COMET"],
    ["STAR", "GEM", "7"],
    ["STAR", "COMET", "7"],
    ["STAR", "GEM", "7"]
  ];
  const evaluation = evaluateReels(reels, [
    { startReel: 0, rows: [0, 0, 0, 0, 0] },
    { startReel: 0, rows: [0, 0, 0, 1, 1] }
  ]);

  assert.equal(evaluation.wins.length, 1);
  assert.equal(evaluation.wins[0].matchedCount, 5);
});

test("evaluateReels allows winning combinations to start from any reel", () => {
  const reels = [
    ["7", "GEM", "COMET"],
    ["STAR", "7", "COMET"],
    ["ORB", "STAR", "GEM"],
    ["BAR", "STAR", "COMET"],
    ["GEM", "STAR", "7"]
  ];
  const evaluation = evaluateReels(reels, [{ startReel: 1, rows: [0, 1, 1, 1] }]);

  assert.equal(evaluation.wins.length, 1);
  assert.equal(evaluation.wins[0].matchedSymbol, "STAR");
  assert.deepEqual(evaluation.wins[0].cells, [
    { reelIndex: 1, rowIndex: 0 },
    { reelIndex: 2, rowIndex: 1 },
    { reelIndex: 3, rowIndex: 1 },
    { reelIndex: 4, rowIndex: 1 }
  ]);
});

test("spin deducts bet immediately and adds combined payline payout", () => {
  const reels = [
    ["STAR", "7", "ORB"],
    ["COMET", "7", "BAR"],
    ["GEM", "7", "STAR"],
    ["ORB", "7", "COMET"],
    ["BAR", "7", "GEM"]
  ];

  const outcome = spin({ balance: 100, bet: 5, reels });

  assert.equal(outcome.payout, 5 * PAYTABLE.get("7:5").multiplier);
  assert.equal(outcome.balance, 100 - 5 + outcome.payout);
  assert.equal(outcome.gameOver, false);
});

test("spin prevents balance from going below zero", () => {
  const reels = [
    ["STAR", "7", "ORB"],
    ["COMET", "BAR", "BAR"],
    ["GEM", "7", "STAR"],
    ["ORB", "COMET", "COMET"],
    ["BAR", "STAR", "GEM"]
  ];

  const outcome = spin({ balance: MIN_BET, bet: MIN_BET, reels });

  assert.equal(outcome.balance, 0);
  assert.equal(outcome.gameOver, true);
});

test("spin uses fallback options when called without arguments", () => {
  const outcome = spin();

  assert.equal(outcome.bet, MIN_BET);
  assert.equal(outcome.reels.length, REEL_COUNT);
  assert.ok(outcome.balance >= 0);
});

test("spin validates symbols before evaluating wins", () => {
  const reels = [
    ["STAR", "7", "ORB"],
    ["COMET", "BAR", "BAR"],
    ["GEM", "BAD", "STAR"],
    ["ORB", "COMET", "COMET"],
    ["BAR", "STAR", "GEM"]
  ];

  assert.throws(() => spin({ balance: 100, bet: 1, reels }), /Unknown reel symbol/);
});

test("legal paths cover all adjacent-row combinations without row skips", () => {
  assert.equal(LEGAL_PATHS.length, 181);
  LEGAL_PATHS.forEach((path) => {
    assert.ok(path.rows.length >= 4);
    assert.ok(path.rows.length <= REEL_COUNT);
    assert.ok(path.startReel >= 0);
    assert.ok(path.startReel + path.rows.length <= REEL_COUNT);

    for (let index = 1; index < path.rows.length; index += 1) {
      assert.ok(Math.abs(path.rows[index] - path.rows[index - 1]) <= 1);
    }
  });
});

test("validateBet enforces minimum, maximum, integer, and balance rules", () => {
  assert.throws(() => validateBet(MIN_BET - 1, 100), RangeError);
  assert.throws(() => validateBet(MAX_BET + 1, 100), RangeError);
  assert.throws(() => validateBet(1.5, 100), TypeError);
  assert.throws(() => validateBet(10, 5), RangeError);
  assert.doesNotThrow(() => validateBet(MIN_BET, MIN_BET));
});
