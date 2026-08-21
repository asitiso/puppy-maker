import { describe, expect, it } from 'vitest';
import { careerTitles, emptyCareerRecords } from './career-records';
import { coreStoryChapterIds, eligibleStoryChapters, type StoryChapterId } from './story-chapters';
import { reconcileBondSceneRewards } from './raising-depth-rewards';
import type { GuardianCallingId } from './guardian-callings';

function resolveRaisingFlow(affection: number, activeCalling: GuardianCallingId | null) {
  const bondProgress = {
    affection,
    outings:1,
    trainings:1,
    gifts:0,
    guardianRank:'guardian' as const,
    bossClears:0,
    annualRecords:0,
    unlocked:[],
    rewarded:[],
    gold:500,
    gems:2,
  };
  const bond = reconcileBondSceneRewards(bondProgress, bondProgress);
  const stories = eligibleStoryChapters({
    memories:['first_training'],
    visitedOutings:['forest','village','lakeside'],
    affection,
    guardianRank:'guardian',
    discoveries:0,
    expeditionStoryEntries:[],
    unlockedBondScenes:bond.unlocked,
    activeCalling,
  });
  const raisingStories = stories.filter((id): id is StoryChapterId => coreStoryChapterIds.includes(id as never)).length;
  const records = { ...emptyCareerRecords(), trainings:1, outings:3 };
  const titles = careerTitles({
    records,
    guardianRank:'guardian',
    openedStories:stories.length,
    openedRaisingStories:raisingStories,
  });
  return { bond, stories, titles };
}

describe('raising -> bond -> story -> career flow', () => {
  it('turns the exact shared-secret bond threshold into a real story and career difference', () => {
    const before = resolveRaisingFlow(74, 'caretaker');
    const after = resolveRaisingFlow(75, 'caretaker');

    expect(before.bond.unlocked).not.toContain('shared_secret');
    expect(before.stories).toEqual(['first_step','wide_world']);
    expect(before.titles).not.toContain('story_witness');

    expect(after.bond.unlocked).toContain('shared_secret');
    expect(after.stories).toEqual(['first_step','wide_world','trusted_bond','guardian_oath']);
    expect(after.titles).toContain('story_witness');
  });

  it('makes the Calling choice meaningful after the same bond result', () => {
    const uncalled = resolveRaisingFlow(75, null);
    const called = resolveRaisingFlow(75, 'caretaker');

    expect(uncalled.bond.unlocked).toEqual(called.bond.unlocked);
    expect(uncalled.stories).toEqual(['first_step','wide_world','trusted_bond']);
    expect(uncalled.titles).not.toContain('story_witness');
    expect(called.stories).toEqual(['first_step','wide_world','trusted_bond','guardian_oath']);
    expect(called.titles).toContain('story_witness');
  });

  it('keeps the core raising story list unique and ordered for downstream career counting', () => {
    const resolved = resolveRaisingFlow(95, 'pathfinder');
    const core = resolved.stories.filter(id => coreStoryChapterIds.includes(id as never));
    expect(core).toEqual(['first_step','wide_world','trusted_bond','guardian_oath']);
    expect(new Set(core).size).toBe(core.length);
  });
});
