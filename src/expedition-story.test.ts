import { describe, expect, it } from 'vitest';
import { expeditionStoryDefinitions, storyEntryForStage } from './expedition-story';

describe('expedition story', () => {
  it('maps exactly one story entry to every expedition stage', () => {
    expect(expeditionStoryDefinitions).toHaveLength(9);
    expect(new Set(expeditionStoryDefinitions.map(item => item.stageId)).size).toBe(9);
  });

  it('uses stronger summaries for regional boss chapters', () => {
    expect(storyEntryForStage('forest_guardian').bossChapter).toBe(true);
    expect(storyEntryForStage('city_core').bossChapter).toBe(true);
    expect(storyEntryForStage('lake_tempest').bossChapter).toBe(true);
    expect(storyEntryForStage('forest_path').bossChapter).toBe(false);
  });
});
