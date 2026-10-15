import { daypartAt, DEFAULT_BOUNDS, formatClock, greetingFor, normalizeBounds, shiftBound } from '../daypart';

const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);

describe('daypartAt', () => {
  it('uses fixed default hours: day 6–17, evening 17–19, night from 19', () => {
    expect(daypartAt(at(5, 59))).toBe('night');
    expect(daypartAt(at(6, 0))).toBe('day');
    expect(daypartAt(at(16, 59))).toBe('day');
    expect(daypartAt(at(17, 0))).toBe('evening');
    expect(daypartAt(at(18, 59))).toBe('evening');
    expect(daypartAt(at(19, 0))).toBe('night');
    expect(daypartAt(at(23, 30))).toBe('night');
    expect(daypartAt(at(0, 15))).toBe('night');
  });

  it('respects bounds changed by the parent', () => {
    const bounds = { dayStart: 7 * 60, eveningStart: 18 * 60, nightStart: 20 * 60 };
    expect(daypartAt(at(6, 30), bounds)).toBe('night');
    expect(daypartAt(at(17, 30), bounds)).toBe('day');
    expect(daypartAt(at(19, 30), bounds)).toBe('evening');
  });

  it('falls back to defaults when bounds are out of order', () => {
    expect(normalizeBounds({ dayStart: 600, eveningStart: 500, nightStart: 1200 })).toEqual(DEFAULT_BOUNDS);
    expect(normalizeBounds({ dayStart: -5, eveningStart: 500, nightStart: 1200 })).toEqual(DEFAULT_BOUNDS);
  });
});

describe('shiftBound', () => {
  it('moves a bound by 30 minutes', () => {
    expect(shiftBound(DEFAULT_BOUNDS, 'eveningStart', 30).eveningStart).toBe(17 * 60 + 30);
  });

  it('never lets evening pass night or day pass evening', () => {
    const b = { dayStart: 6 * 60, eveningStart: 18 * 60 + 30, nightStart: 19 * 60 };
    expect(shiftBound(b, 'eveningStart', 30).eveningStart).toBe(18 * 60 + 30);
    const d = { dayStart: 16 * 60 + 30, eveningStart: 17 * 60, nightStart: 19 * 60 };
    expect(shiftBound(d, 'dayStart', 30).dayStart).toBe(16 * 60 + 30);
    expect(shiftBound(DEFAULT_BOUNDS, 'nightStart', 10 * 60).nightStart).toBe(23 * 60 + 30);
  });
});

describe('formatting', () => {
  it('formats clock times', () => {
    expect(formatClock(360)).toBe('06:00');
    expect(formatClock(19 * 60 + 30)).toBe('19:30');
  });

  it('greets per daypart', () => {
    expect(greetingFor('day').hello).toBe('Dzień dobry');
    expect(greetingFor('evening').hello).toBe('Dobry wieczór');
    expect(greetingFor('night').hello).toBe('Dobranoc');
  });
});
