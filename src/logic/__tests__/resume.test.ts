import { describe, expect, it } from '@jest/globals';

import { AFTER_STORY_OPTIONS, afterStoryLabel, isAfterStory, resumePosition } from '../resume';

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

describe('after-story options', () => {
  it('offers silence first, then the 10-minute melody', () => {
    expect(AFTER_STORY_OPTIONS.map((o) => o.mode)).toEqual(['silence', 'melody']);
  });
  it('validates stored values', () => {
    expect(isAfterStory('silence')).toBe(true);
    expect(isAfterStory('melody')).toBe(true);
    expect(isAfterStory('end')).toBe(false);
    expect(isAfterStory(15)).toBe(false);
  });
  it('labels the player button', () => {
    expect(afterStoryLabel('silence')).toBe('Cisza po bajce');
    expect(afterStoryLabel('melody')).toBe('Melodia 10 min');
  });
});
