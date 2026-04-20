import test from "node:test";
import assert from "node:assert/strict";
import {
  CENTER_ROW_INDEX,
  MAX_BET,
  MIN_BET,
  PAYTABLE,
  REEL_COUNT,
  ROW_COUNT,
  evaluatePayline,
  generateSpinResult,
  getCenterPayline,
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

test("getCenterPayline evaluates only the center horizontal row", () => {
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

test("spin deducts bet immediately and adds payout from multiplier", () => {
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

test("validateBet enforces minimum, maximum, integer, and balance rules", () => {
  assert.throws(() => validateBet(MIN_BET - 1, 100), RangeError);
  assert.throws(() => validateBet(MAX_BET + 1, 100), RangeError);
  assert.throws(() => validateBet(1.5, 100), TypeError);
  assert.throws(() => validateBet(10, 5), RangeError);
  assert.doesNotThrow(() => validateBet(MIN_BET, MIN_BET));
});
