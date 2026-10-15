import { describe, expect, it } from '@jest/globals';

import { isSleepMode, resumePosition, sleepLabel, SLEEP_OPTIONS } from '../resume';

describe('resumePosition', () => {
  it('starts from the beginning without a saved position', () => {
    expect(resumePosition(undefined, 600)).toBe(0);
  });

  it('ignores very short listening', () => {
    expect(resumePosition(10, 600)).toBe(0);
  });

  it('ignores a story that was nearly finished', () => {
    expect(resumePosition(590, 600)).toBe(0);
  });

  it('resumes in the middle', () => {
    expect(resumePosition(245.7, 600)).toBe(245);
  });
});

describe('sleep options', () => {
  it('offers the agreed options with "Po tej bajce" first', () => {
    expect(SLEEP_OPTIONS.map((o) => o.short)).toEqual(['Po tej bajce', '15 min', '30 min', '45 min']);
  });

  it('validates stored values', () => {
    expect(isSleepMode('end')).toBe(true);
    expect(isSleepMode(30)).toBe(true);
    expect(isSleepMode(20)).toBe(false);
    expect(isSleepMode('30')).toBe(false);
  });

  it('labels the active timer in whole minutes', () => {
    expect(sleepLabel('end', 300, false)).toBe('Po tej bajce');
    expect(sleepLabel(15, 900, false)).toBe('15 min');
    expect(sleepLabel(15, 61, true)).toBe('Za 2 min');
  });
});
