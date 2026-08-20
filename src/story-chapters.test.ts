import { describe, expect, it } from 'vitest';
import { coreStoryChapterIds, eligibleStoryChapters, storyChapterDefinitions } from './story-chapters';

describe('story chapter rules', () => {
  it('preserves the five raising chapters then appends nine expedition chapters', () => {
    expect(coreStoryChapterIds).toEqual([
      'first_step', 'wide_world', 'trusted_bond', 'guardian_oath', 'starlight_road',
    ]);
    expect(storyChapterDefinitions).toHaveLength(14);
    expect(storyChapterDefinitions.slice(5).map(chapter => chapter.id)).toEqual([
      'forest_path','forest_glade','forest_guardian','city_square','city_gallery','city_core','lake_channel','lake_cliff','lake_tempest',
    ]);
  });

  it('unlocks raising chapters from existing game progress without separate counters', () => {
    expect(eligibleStoryChapters({
      memories: [], visitedOutings: [], affection: 70, guardianRank: 'trainee', discoveries: 0, expeditionStoryEntries: [],
    })).toEqual([]);

    expect(eligibleStoryChapters({
      memories: ['first_training'], visitedOutings: [], affection: 70, guardianRank: 'trainee', discoveries: 0, expeditionStoryEntries: [],
    })).toEqual(['first_step']);

    expect(eligibleStoryChapters({
      memories: ['first_training'], visitedOutings: ['forest', 'village', 'lakeside'], affection: 90, guardianRank: 'guardian', discoveries: 2, expeditionStoryEntries: [],
    })).toEqual(['first_step', 'wide_world', 'trusted_bond', 'guardian_oath']);
  });

  it('uses unlocked bond scenes as the trusted-bond source when relationship progress is supplied', () => {
    const base = {
      memories: [],
      visitedOutings: [],
      affection: 95,
      guardianRank: 'trainee' as const,
      discoveries: 0,
      expeditionStoryEntries: [],
      unlockedBondScenes: [] as const,
    };
    expect(eligibleStoryChapters(base)).not.toContain('trusted_bond');
    expect(eligibleStoryChapters({ ...base, unlockedBondScenes:['shared_secret'] as const })).toContain('trusted_bond');
  });

  it('requires an actual Calling choice for guardian oath when Calling progress is supplied', () => {
    const base = {
      memories: [],
      visitedOutings: [],
      affection: 95,
      guardianRank: 'guardian' as const,
      discoveries: 0,
      expeditionStoryEntries: [],
      activeCalling: null,
    };
    expect(eligibleStoryChapters(base)).not.toContain('guardian_oath');
    expect(eligibleStoryChapters({ ...base, activeCalling:'caretaker' as const })).toContain('guardian_oath');
  });

  it('describes Calling-dependent story gates in the player-facing unlock hints', () => {
    expect(storyChapterDefinitions.find(chapter => chapter.id === 'guardian_oath')?.unlockHint).toContain('Calling');
    expect(storyChapterDefinitions.find(chapter => chapter.id === 'starlight_road')?.unlockHint).toContain('Calling');
  });

  it('unlocks expedition chapters exactly from cleared expedition story entries', () => {
    const opened = eligibleStoryChapters({
      memories: [], visitedOutings: [], affection: 0, guardianRank: 'trainee', discoveries: 0,
      expeditionStoryEntries: ['forest_path','forest_glade'],
    });
    expect(opened).toEqual(['forest_path','forest_glade']);
  });

  it('requires veteran rank and four discoveries for the final raising chapter', () => {
    const base = {
      memories: ['first_training'], visitedOutings: ['forest', 'village', 'lakeside'], affection: 90, guardianRank: 'veteran' as const, expeditionStoryEntries: [],
    };
    expect(eligibleStoryChapters({ ...base, discoveries: 3 })).not.toContain('starlight_road');
    expect(eligibleStoryChapters({ ...base, discoveries: 4 })).toContain('starlight_road');
  });
});
