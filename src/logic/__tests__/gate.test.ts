import { GATE_MAX, GATE_MIN, isGateAnswerCorrect, makeGateQuestion } from '../gate';

describe('parent gate', () => {
  it('always uses factors 2–9', () => {
    for (const r of [0, 0.1, 0.5, 0.99, 0.999999]) {
      const q = makeGateQuestion(() => r);
      expect(q.a).toBeGreaterThanOrEqual(GATE_MIN);
      expect(q.a).toBeLessThanOrEqual(GATE_MAX);
      expect(q.b).toBeGreaterThanOrEqual(GATE_MIN);
      expect(q.b).toBeLessThanOrEqual(GATE_MAX);
    }
  });

  it('covers the whole range', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 8; i++) seen.add(makeGateQuestion(() => i / 8 + 0.01).a);
    expect([...seen].sort()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('accepts only the correct product', () => {
    const q = { a: 7, b: 4 };
    expect(isGateAnswerCorrect(q, '28')).toBe(true);
    expect(isGateAnswerCorrect(q, ' 28 ')).toBe(true);
    expect(isGateAnswerCorrect(q, '27')).toBe(false);
    expect(isGateAnswerCorrect(q, '')).toBe(false);
    expect(isGateAnswerCorrect(q, '2 8')).toBe(false);
    expect(isGateAnswerCorrect(q, '28.0')).toBe(false);
  });
});
