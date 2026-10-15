import { fallbackCatalog } from '../fallback-catalog';
import { isBundled, isPublished, parseCatalog } from '../types';

describe('parseCatalog', () => {
  it('rejects non-catalog input', () => {
    expect(parseCatalog(null)).toBeNull();
    expect(parseCatalog({ stories: 'x' })).toBeNull();
    expect(parseCatalog({ stories: [] })).toBeNull();
  });

  it('drops invalid stories and keeps valid ones', () => {
    const c = parseCatalog({
      version: 2,
      stories: [
        { id: 'ok-1', title: 'A', durationSec: 60, audioUrl: 'https://x/a.mp3' },
        { id: 'Bad Id', title: 'B', durationSec: 60, audioUrl: 'https://x/b.mp3' },
        { id: 'no-audio', title: 'C', durationSec: 60 },
      ],
    });
    expect(c?.version).toBe(2);
    expect(c?.stories.map((s) => s.id)).toEqual(['ok-1']);
  });

  it('hides stories scheduled for the future', () => {
    const c = parseCatalog({
      stories: [
        { id: 'now', title: 'A', durationSec: 60, audioUrl: 'u' },
        { id: 'later', title: 'B', durationSec: 60, audioUrl: 'u', publishAt: '2999-01-01' },
      ],
    });
    expect(c?.stories.map((s) => s.id)).toEqual(['now']);
  });
});

describe('isPublished', () => {
  const now = new Date(2026, 9, 15, 12);
  it('treats missing or broken dates as published', () => {
    expect(isPublished({}, now)).toBe(true);
    expect(isPublished({ publishAt: 'nie-data' }, now)).toBe(true);
  });
  it('compares by day', () => {
    expect(isPublished({ publishAt: '2026-10-15' }, now)).toBe(true);
    expect(isPublished({ publishAt: '2026-10-16' }, now)).toBe(false);
  });
});

describe('fallback catalog', () => {
  it('has four bundled test stories and one featured', () => {
    expect(fallbackCatalog.stories).toHaveLength(4);
    expect(fallbackCatalog.stories.every(isBundled)).toBe(true);
    expect(fallbackCatalog.stories.filter((s) => s.featured)).toHaveLength(1);
  });
});
