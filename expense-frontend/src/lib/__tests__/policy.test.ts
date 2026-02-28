import { describe, it, expect } from 'vitest';
import { evaluateDraftWarnings, POLICY } from '../policy';

describe('evaluateDraftWarnings', () => {
  // ─── Edge cases ──────────────────────────────────────────────────────────
  it('returns empty array for empty items', () => {
    expect(evaluateDraftWarnings({ items: [] })).toEqual([]);
  });

  it('returns empty array for undefined items', () => {
    expect(evaluateDraftWarnings({})).toEqual([]);
  });

  it('returns empty array for null items (casted)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(evaluateDraftWarnings({ items: null as any })).toEqual([]);
  });

  // ─── Normal cases ────────────────────────────────────────────────────────
  it('no warnings when all amounts are below caps', () => {
    const result = evaluateDraftWarnings({
      country: 'United States',
      departureDate: '2025-01-01',
      returnDate: '2025-01-05',
      items: [
        { date: '2025-01-01', category: 'Airfare', amount: 400, description: 'Flight' },
        { date: '2025-01-02', category: 'Hotel', amount: 200, description: 'Hotel night' },
        { date: '2025-01-03', category: 'Entertainment', amount: 80, description: 'Dinner' },
      ],
    });
    expect(result).toEqual([]);
  });

  // ─── Boundary values ─────────────────────────────────────────────────────
  it('no warning at exactly HOTEL_NIGHTLY_LIMIT', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Hotel', amount: POLICY.HOTEL_NIGHTLY_LIMIT, description: 'Hotel' }],
    });
    expect(result.find((w) => w.code === 'HOTEL_ABOVE_CAP')).toBeUndefined();
  });

  it('no warning at exactly ENTERTAINMENT_LIMIT', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Entertainment', amount: POLICY.ENTERTAINMENT_LIMIT, description: 'Dinner' }],
    });
    expect(result.find((w) => w.code === 'ENTERTAINMENT_ABOVE_CAP')).toBeUndefined();
  });

  it('no warning at exactly AIRFARE_LIMIT_US', () => {
    const result = evaluateDraftWarnings({
      country: 'United States',
      items: [{ category: 'Airfare', amount: POLICY.AIRFARE_LIMIT_US, description: 'Flight' }],
    });
    expect(result.find((w) => w.code === 'AIRFARE_ABOVE_CAP')).toBeUndefined();
  });

  // ─── Violations ──────────────────────────────────────────────────────────
  it('HOTEL_ABOVE_CAP when hotel > $250', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Hotel', amount: 251, description: 'Hotel' }],
    });
    expect(result.some((w) => w.code === 'HOTEL_ABOVE_CAP')).toBe(true);
  });

  it('ENTERTAINMENT_ABOVE_CAP when entertainment > $100', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Entertainment', amount: 101, description: 'Party' }],
    });
    expect(result.some((w) => w.code === 'ENTERTAINMENT_ABOVE_CAP')).toBe(true);
  });

  it('AIRFARE_ABOVE_CAP (US) when airfare > $500', () => {
    const result = evaluateDraftWarnings({
      country: 'United States',
      items: [{ category: 'Airfare', amount: 501, description: 'Flight' }],
    });
    expect(result.some((w) => w.code === 'AIRFARE_ABOVE_CAP')).toBe(true);
  });

  it('AIRFARE_ABOVE_CAP (intl) when airfare > $1000', () => {
    const result = evaluateDraftWarnings({
      country: 'South Korea',
      items: [{ category: 'Airfare', amount: 1001, description: 'Flight' }],
    });
    expect(result.some((w) => w.code === 'AIRFARE_ABOVE_CAP')).toBe(true);
  });

  it('no AIRFARE_ABOVE_CAP (intl) at $1000', () => {
    const result = evaluateDraftWarnings({
      country: 'Japan',
      items: [{ category: 'Airfare', amount: 1000, description: 'Flight' }],
    });
    expect(result.find((w) => w.code === 'AIRFARE_ABOVE_CAP')).toBeUndefined();
  });

  it('TRANSPORTATION_ABOVE_CAP when > $150', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Transportation', amount: 151, description: 'Taxi' }],
    });
    expect(result.some((w) => w.code === 'TRANSPORTATION_ABOVE_CAP')).toBe(true);
  });

  it('OFFICE_ABOVE_CAP when > $200', () => {
    const result = evaluateDraftWarnings({
      items: [{ category: 'Office', amount: 201, description: 'Supplies' }],
    });
    expect(result.some((w) => w.code === 'OFFICE_ABOVE_CAP')).toBe(true);
  });

  // ─── Meal daily rollup ───────────────────────────────────────────────────
  it('MEALS_ABOVE_DAILY_CAP when same-day meals total > $75', () => {
    const result = evaluateDraftWarnings({
      items: [
        { date: '2025-01-01', category: 'Meal', amount: 50, description: 'Per diem' },
        { date: '2025-01-01', category: 'Meal', amount: 30, description: 'Per diem' },
      ],
    });
    expect(result.some((w) => w.code === 'MEALS_ABOVE_DAILY_CAP')).toBe(true);
  });

  it('no MEALS_ABOVE_DAILY_CAP when meals split across days', () => {
    const result = evaluateDraftWarnings({
      items: [
        { date: '2025-01-01', category: 'Meal', amount: 50, description: 'Per diem' },
        { date: '2025-01-02', category: 'Meal', amount: 50, description: 'Per diem' },
      ],
    });
    expect(result.find((w) => w.code === 'MEALS_ABOVE_DAILY_CAP')).toBeUndefined();
  });

  // ─── Trip date validation ─────────────────────────────────────────────────
  it('TRIP_DATES_INVALID when departure > return', () => {
    const result = evaluateDraftWarnings({
      departureDate: '2025-01-10',
      returnDate: '2025-01-05',
      items: [],
    });
    expect(result.some((w) => w.code === 'TRIP_DATES_INVALID')).toBe(true);
  });

  it('no TRIP_DATES_INVALID when departure === return', () => {
    const result = evaluateDraftWarnings({
      departureDate: '2025-01-05',
      returnDate: '2025-01-05',
      items: [],
    });
    expect(result.find((w) => w.code === 'TRIP_DATES_INVALID')).toBeUndefined();
  });

  it('ITEM_DATE_OUTSIDE_TRIP when item date before departure', () => {
    const result = evaluateDraftWarnings({
      departureDate: '2025-01-05',
      returnDate: '2025-01-10',
      items: [{ date: '2025-01-04', category: 'Hotel', amount: 200, description: 'Hotel' }],
    });
    expect(result.some((w) => w.code === 'ITEM_DATE_OUTSIDE_TRIP')).toBe(true);
  });

  // ─── Deduplication ───────────────────────────────────────────────────────
  it('deduplicate warnings with same code', () => {
    const result = evaluateDraftWarnings({
      items: [
        { category: 'Hotel', amount: 300, description: 'Hotel 1' },
        { category: 'Hotel', amount: 350, description: 'Hotel 2' },
      ],
    });
    const hotelWarnings = result.filter((w) => w.code === 'HOTEL_ABOVE_CAP');
    expect(hotelWarnings).toHaveLength(1);
  });
});
