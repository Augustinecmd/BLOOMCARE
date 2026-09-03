import test from "node:test";
import assert from "node:assert/strict";
import { calculatePregnancyStatus, calculateEddFromLmp, isValidLmp } from "../BLOOMCARE-main/pregnancy-calculations.js";

const today = new Date(2026, 7, 22);

test("calculates requested gestational ages from LMP", () => {
  for (const weeks of [1, 8, 20, 28, 40]) {
    const lmp = new Date(Date.UTC(2026, 7, 22 - weeks * 7)).toISOString().slice(0, 10);
    const result = calculatePregnancyStatus({ lmp }, today);
    assert.equal(result.weeks, weeks);
    assert.equal(result.days, 0);
  }
});

test("calculates trimester, progress, due date, and remaining days", () => {
  const result = calculatePregnancyStatus({ lmp: "2026-06-20" }, today);
  assert.deepEqual({ weeks: result.weeks, days: result.days, trimester: result.trimester, edd: result.edd, progress: result.progress, daysRemaining: result.daysRemaining }, { weeks: 9, days: 0, trimester: 1, edd: "2027-03-27", progress: 23, daysRemaining: 217 });
});

test("handles missing, invalid, and future pregnancy dates", () => {
  assert.equal(calculatePregnancyStatus({}, today).complete, false);
  assert.equal(isValidLmp("2026-08-23", today), false);
  assert.equal(isValidLmp("2026-02-30", today), false);
  assert.equal(calculatePregnancyStatus({ lmp: "2026-08-23" }, today).reason, "future");
});

test("calculates EDD from LMP without changing the source date", () => {
  assert.equal(calculateEddFromLmp("2026-06-20"), "2027-03-27");
  assert.equal(calculatePregnancyStatus({ lmp: "2026-06-20" }, today).lmp, "2026-06-20");
});
