import { describe, expect, it } from 'vitest';
import { guardianEvolution } from './guardian-evolution';

describe('guardian expedition evolution', () => {
  it('starts at apprentice', () => {
    expect(guardianEvolution({ guardianRank: 'trainee', bossClears: 0, allStagesS: false, archiveCurrent: 10, legacyId: 'new_chronicle' })).toBe('apprentice');
  });

  it('becomes guardian at guardian rank or above', () => {
    expect(guardianEvolution({ guardianRank: 'guardian', bossClears: 0, allStagesS: false, archiveCurrent: 30, legacyId: 'new_chronicle' })).toBe('guardian');
  });

  it('requires all three bosses plus archive 75 for star guardian', () => {
    expect(guardianEvolution({ guardianRank: 'starlight', bossClears: 3, allStagesS: false, archiveCurrent: 74, legacyId: 'living_legend' })).toBe('guardian');
    expect(guardianEvolution({ guardianRank: 'starlight', bossClears: 2, allStagesS: false, archiveCurrent: 75, legacyId: 'living_legend' })).toBe('guardian');
    expect(guardianEvolution({ guardianRank: 'starlight', bossClears: 3, allStagesS: false, archiveCurrent: 75, legacyId: 'living_legend' })).toBe('star_guardian');
  });

  it('requires all stages S, archive 100 and top legacy for legendary guardian', () => {
    expect(guardianEvolution({ guardianRank: 'starlight', bossClears: 3, allStagesS: true, archiveCurrent: 100, legacyId: 'living_legend' })).toBe('star_guardian');
    expect(guardianEvolution({ guardianRank: 'starlight', bossClears: 3, allStagesS: true, archiveCurrent: 100, legacyId: 'eternal_guardian' })).toBe('legendary_guardian');
  });
});
