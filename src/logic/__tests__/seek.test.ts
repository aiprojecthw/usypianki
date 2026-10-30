import { describe, expect, it } from '@jest/globals';

import { clampSeekTarget, seekReturnsToStory } from '../seek';

describe('clampSeekTarget', () => {
  it('zostawia cel w środku bajki bez zmian', () => {
    expect(clampSeekTarget(120, 392)).toBe(120);
  });

  it('nie schodzi poniżej zera', () => {
    expect(clampSeekTarget(-15, 392)).toBe(0);
  });

  it('zatrzymuje się sekundę przed końcem, żeby nie kończyć bajki przewinięciem', () => {
    expect(clampSeekTarget(400, 392)).toBe(391);
    expect(clampSeekTarget(392, 392)).toBe(391);
  });

  it('cofnięcie o 15 s od samego końca trafia 15 s przed koniec', () => {
    expect(clampSeekTarget(392 - 15, 392)).toBe(377);
  });

  it('przy nieznanej długości (0) zostaje na początku', () => {
    expect(clampSeekTarget(30, 0)).toBe(0);
  });

  it('ignoruje nieprawidłowy cel', () => {
    expect(clampSeekTarget(Number.NaN, 392)).toBe(0);
  });
});

describe('seekReturnsToStory', () => {
  it('przewinięcie w trakcie melodii wraca do bajki', () => {
    expect(seekReturnsToStory(true)).toBe(true);
  });

  it('bez melodii przewinięcie niczego nie włącza samo', () => {
    expect(seekReturnsToStory(false)).toBe(false);
  });
});
