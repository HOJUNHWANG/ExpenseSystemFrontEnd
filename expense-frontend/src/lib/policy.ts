// Frontend-only policy helper to show real-time warnings during Create.
// Keep this aligned with backend PolicyEngine.

import type { PolicyWarning } from "../types";

export const POLICY = {
  HOTEL_NIGHTLY_LIMIT: 250,
  ENTERTAINMENT_LIMIT: 100,
  AIRFARE_LIMIT_US: 500,
  AIRFARE_LIMIT_INTL: 1000,
  MEAL_DAILY_LIMIT: 75,
  TRANSPORTATION_LIMIT: 150,
  OFFICE_LIMIT: 200,
} as const;

interface PolicyItem {
  date?: string | null;
  description?: string | null;
  amount?: string | number | null;
  category?: string | null;
}

interface EvaluateParams {
  country?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  items?: (PolicyItem | null)[];
}

function isUnitedStates(country: string | null | undefined): boolean {
  if (!country) return false;
  const c = String(country).trim().toLowerCase();
  return (
    c === "united states" || c === "usa" || c === "united states of america"
  );
}

export function evaluateDraftWarnings({
  country,
  departureDate,
  returnDate,
  items,
}: EvaluateParams): PolicyWarning[] {
  const warnings: PolicyWarning[] = [];

  if (departureDate && returnDate && departureDate > returnDate) {
    warnings.push({
      code: "TRIP_DATES_INVALID",
      message: "Trip dates invalid (departure after return)",
    });
  }

  const dep = departureDate || null;
  const ret = returnDate || null;

  const mealByDate = new Map<string, number>();

  for (const it of items || []) {
    if (!it) continue;

    if (dep && ret && it.date) {
      if (it.date < dep || it.date > ret) {
        warnings.push({
          code: "ITEM_DATE_OUTSIDE_TRIP",
          message: "Item date outside trip range",
        });
        break;
      }
    }

    const cat = (it.category || "").trim();
    const amt = Number(it.amount || 0);

    if (
      cat.toLowerCase() === "entertainment" &&
      amt > POLICY.ENTERTAINMENT_LIMIT
    ) {
      warnings.push({
        code: "ENTERTAINMENT_ABOVE_CAP",
        message: `Entertainment above cap ($${POLICY.ENTERTAINMENT_LIMIT})`,
      });
    }

    if (
      (cat.toLowerCase() === "hotel" ||
        cat.toLowerCase().includes("lodg")) &&
      amt > POLICY.HOTEL_NIGHTLY_LIMIT
    ) {
      warnings.push({
        code: "HOTEL_ABOVE_CAP",
        message: `Hotel above nightly cap ($${POLICY.HOTEL_NIGHTLY_LIMIT})`,
      });
    }

    if (cat.toLowerCase() === "airfare") {
      const limit = isUnitedStates(country)
        ? POLICY.AIRFARE_LIMIT_US
        : POLICY.AIRFARE_LIMIT_INTL;
      if (amt > limit) {
        warnings.push({
          code: "AIRFARE_ABOVE_CAP",
          message: `Airfare above cap ($${limit})`,
        });
      }
    }

    if (
      cat.toLowerCase() === "transportation" &&
      amt > POLICY.TRANSPORTATION_LIMIT
    ) {
      warnings.push({
        code: "TRANSPORTATION_ABOVE_CAP",
        message: `Transportation above cap ($${POLICY.TRANSPORTATION_LIMIT})`,
      });
    }

    if (cat.toLowerCase() === "office" && amt > POLICY.OFFICE_LIMIT) {
      warnings.push({
        code: "OFFICE_ABOVE_CAP",
        message: `Office expenses above cap ($${POLICY.OFFICE_LIMIT})`,
      });
    }

    const desc = (it.description || "").toLowerCase();
    const isMeal =
      cat.toLowerCase().includes("meal") || desc.includes("per diem");
    if (isMeal && it.date) {
      mealByDate.set(it.date, (mealByDate.get(it.date) || 0) + amt);
    }
  }

  for (const [, total] of mealByDate.entries()) {
    if (total > POLICY.MEAL_DAILY_LIMIT) {
      warnings.push({
        code: "MEALS_ABOVE_DAILY_CAP",
        message: `Meals exceed daily cap ($${POLICY.MEAL_DAILY_LIMIT})`,
      });
      break;
    }
  }

  // dedupe by code
  const seen = new Set<string>();
  const out: PolicyWarning[] = [];
  for (const w of warnings) {
    if (!w?.code) continue;
    if (seen.has(w.code)) continue;
    seen.add(w.code);
    out.push(w);
  }
  return out;
}
