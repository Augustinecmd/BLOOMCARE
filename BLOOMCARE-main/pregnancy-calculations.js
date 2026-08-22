const DAY_MS = 24 * 60 * 60 * 1000;
const GESTATION_DAYS = 280;

function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function calculatePregnancyStatus(profile = {}, today = new Date()) {
  const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const lmp = parseDateOnly(profile.lmp);
  const storedEdd = parseDateOnly(profile.edd);
  const sourceDate = lmp || (storedEdd ? new Date(storedEdd.getTime() - GESTATION_DAYS * DAY_MS) : null);

  if (!sourceDate || sourceDate > todayDate) {
    return { complete: false, reason: sourceDate && sourceDate > todayDate ? "future" : "missing" };
  }

  const calculatedEdd = new Date(sourceDate.getTime() + GESTATION_DAYS * DAY_MS);
  const dueDate = lmp ? calculatedEdd : storedEdd;
  const gestationalDays = Math.floor((todayDate.getTime() - sourceDate.getTime()) / DAY_MS);
  const weeks = Math.floor(gestationalDays / 7);
  const days = gestationalDays % 7;
  const daysRemaining = Math.max(0, Math.ceil((dueDate.getTime() - todayDate.getTime()) / DAY_MS));
  const progress = Math.min(100, Math.max(0, Math.round((gestationalDays / GESTATION_DAYS) * 100)));
  const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;

  return {
    complete: true,
    lmp: lmp ? dateOnly(lmp) : "",
    edd: dateOnly(dueDate),
    weeks,
    days,
    gestationalDays,
    trimester,
    progress,
    daysRemaining,
    dueDateIsConsistent: !storedEdd || storedEdd.getTime() === calculatedEdd.getTime()
  };
}

export function isValidLmp(value, today = new Date()) {
  const lmp = parseDateOnly(value);
  const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return Boolean(lmp && lmp <= todayDate);
}

export function calculateEddFromLmp(value) {
  const lmp = parseDateOnly(value);
  return lmp ? dateOnly(new Date(lmp.getTime() + GESTATION_DAYS * DAY_MS)) : "";
}
