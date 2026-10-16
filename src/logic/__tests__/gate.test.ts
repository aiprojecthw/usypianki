import { describe, expect, it } from '@jest/globals';

import { GATE_FIXED, isGateAnswerCorrect, makeGateQuestion } from '../gate';

describe('parent gate', () => {
  it('always multiplies by 3 with the other factor 1–9', () => {
    for (const r of [0, 0.1, 0.5, 0.99, 0.999999]) {
      const q = makeGateQuestion(() => r);
      expect([q.a, q.b]).toContain(GATE_FIXED);
      const other = q.a === GATE_FIXED ? q.b : q.a;
      expect(other).toBeGreaterThanOrEqual(1);
      expect(other).toBeLessThanOrEqual(9);
    }
  });

  it('covers 1–9 and both orders', () => {
    const others = new Set<number>();
    const orders = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const vals = [i / 9 + 0.01, i % 2 ? 0.2 : 0.8];
      let k = 0;
      const q = makeGateQuestion(() => vals[k++]);
      others.add(q.a === GATE_FIXED ? q.b : q.a);
      orders.add(q.a === GATE_FIXED ? 'first' : 'second');
    }
    expect([...others].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(orders.size).toBe(2);
  });

  it('accepts only the correct product', () => {
    const q = { a: 3, b: 7 };
    expect(isGateAnswerCorrect(q, '21')).toBe(true);
    expect(isGateAnswerCorrect(q, ' 21 ')).toBe(true);
    expect(isGateAnswerCorrect(q, '20')).toBe(false);
    expect(isGateAnswerCorrect(q, '')).toBe(false);
    expect(isGateAnswerCorrect(q, '2 1')).toBe(false);
  });
});
