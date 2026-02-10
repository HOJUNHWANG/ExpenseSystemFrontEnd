import countries from "world-countries";

// world-countries contains objects with `name.common` among other fields.
export const COUNTRY_OPTIONS = countries
  .map((c) => c?.name?.common)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));
