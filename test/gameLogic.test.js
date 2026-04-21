import test from "node:test";
import assert from "node:assert/strict";
import {
  CENTER_ROW_INDEX,
  MAX_BET,
  MIN_BET,
  PAYTABLE,
  PAYLINES,
  REEL_COUNT,
  ROW_COUNT,
  evaluatePayline,
  evaluateReels,
  generateSpinResult,
  getCenterPayline,
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

test("getCenterPayline still extracts the middle horizontal row", () => {
  const reels = [
    ["7", "BAR", "7"],
    ["7", "BAR", "STAR"],
    ["COMET", "BAR", "7"],
    ["7", "BAR", "ORB"],
    ["GEM", "BAR", "7"]
  ];

  assert.deepEqual(getCenterPayline(reels), Array(REEL_COUNT).fill("BAR"));
  assert.equal(CENTER_ROW_INDEX, 1);
});

test("evaluatePayline uses the paytable for left-to-right matches", () => {
  const win = evaluatePayline(["GEM", "GEM", "GEM", "STAR", "GEM"]);
  const expectedEntry = PAYTABLE.get("GEM:3");

  assert.equal(win.key, "GEM:3");
  assert.equal(win.multiplier, expectedEntry.multiplier);
});

test("evaluatePayline returns no match for fewer than three center matches", () => {
  const win = evaluatePayline(["ORB", "ORB", "COMET", "ORB", "ORB"]);

  assert.equal(win.multiplier, 0);
  assert.equal(win.key, null);
});

test("evaluateReels totals multiple winning paylines", () => {
  const reels = [
    ["7", "BAR", "COMET"],
    ["7", "BAR", "STAR"],
    ["7", "BAR", "ORB"],
    ["GEM", "BAR", "7"],
    ["ORB", "BAR", "GEM"]
  ];
  const evaluation = evaluateReels(reels);

  assert.equal(evaluation.wins.length, 2);
  assert.equal(evaluation.totalMultiplier, PAYTABLE.get("7:3").multiplier + PAYTABLE.get("BAR:5").multiplier);
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

test("traditional rules define nine active paylines", () => {
  assert.equal(PAYLINES.length, 9);
  PAYLINES.forEach((payline) => assert.equal(payline.rows.length, REEL_COUNT));
});

test("validateBet enforces minimum, maximum, integer, and balance rules", () => {
  assert.throws(() => validateBet(MIN_BET - 1, 100), RangeError);
  assert.throws(() => validateBet(MAX_BET + 1, 100), RangeError);
  assert.throws(() => validateBet(1.5, 100), TypeError);
  assert.throws(() => validateBet(10, 5), RangeError);
  assert.doesNotThrow(() => validateBet(MIN_BET, MIN_BET));
});
