import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDuration, getEffectiveStatus, isWithinWorkingHours } from "../../src/lib/availability.ts";
import type { Settings } from "../../src/lib/types.ts";

const at = (hours: number, minutes = 0) => new Date(2026, 9, 20, hours, minutes).getTime();
const settings = (status: Settings["status"], start: string, end: string, enforce: boolean) => ({ status, hours: { start, end, enforce } }) as Settings;

test("working hours on the same day", () => {
  const day = settings("active", "09:00", "22:00", true);
  assert.equal(isWithinWorkingHours(day, at(10)), true);
  assert.equal(isWithinWorkingHours(day, at(23)), false);
});

test("working hours that pass midnight", () => {
  const night = settings("active", "20:00", "02:00", true);
  assert.equal(isWithinWorkingHours(night, at(1)), true);
  assert.equal(isWithinWorkingHours(night, at(12)), false);
});

test("offline wins, and closed hours mean offline only when enforced", () => {
  assert.equal(getEffectiveStatus(settings("offline", "09:00", "22:00", false), at(12)), "offline");
  assert.equal(getEffectiveStatus(settings("away", "09:00", "22:00", true), at(23)), "offline");
  assert.equal(getEffectiveStatus(settings("away", "09:00", "22:00", false), at(23)), "away");
});

test("durations read naturally", () => {
  assert.equal(formatDuration(30), "30 min");
  assert.equal(formatDuration(120), "2h");
  assert.equal(formatDuration(90), "1h 30m");
});
