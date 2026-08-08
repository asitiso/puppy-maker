import { describe, expect, it } from 'vitest';
import { eligibleStoryChapters, storyChapterDefinitions } from './story-chapters';

describe('story chapter rules', () => {
  it('keeps all five chapters in narrative order', () => {
    expect(storyChapterDefinitions.map(chapter => chapter.id)).toEqual([
      'first_step', 'wide_world', 'trusted_bond', 'guardian_oath', 'starlight_road',
    ]);
  });

  it('unlocks chapters from existing game progress without separate counters', () => {
    expect(eligibleStoryChapters({
      memories: [], visitedOutings: [], affection: 70, guardianRank: 'trainee', discoveries: 0,
    })).toEqual([]);

    expect(eligibleStoryChapters({
      memories: ['first_training'], visitedOutings: [], affection: 70, guardianRank: 'trainee', discoveries: 0,
    })).toEqual(['first_step']);

    expect(eligibleStoryChapters({
      memories: ['first_training'], visitedOutings: ['forest', 'village', 'lake'], affection: 90, guardianRank: 'guardian', discoveries: 2,
    })).toEqual(['first_step', 'wide_world', 'trusted_bond', 'guardian_oath']);
  });

  it('requires veteran rank and four discoveries for the final chapter', () => {
    const base = {
      memories: ['first_training'], visitedOutings: ['forest', 'village', 'lake'], affection: 90, guardianRank: 'veteran' as const,
    };
    expect(eligibleStoryChapters({ ...base, discoveries: 3 })).not.toContain('starlight_road');
    expect(eligibleStoryChapters({ ...base, discoveries: 4 })).toContain('starlight_road');
  });
});
