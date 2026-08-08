import { describe, expect, it } from 'vitest';
import { collectionArchive } from './collection-archive';

const base = { memories:3, discoveries:2, stories:1, talents:4, titles:2, seasonStamps:2, legacyRelics:1, ambitionHonors:2 };
const expedition = { expeditionStages:4, expeditionBosses:1, expeditionRelics:2, expeditionStories:3, expeditionDiscoveries:2, guardianEvolution:2, expeditionCrafting:1, expeditionRegions:1, expeditionSMilestones:1 };

describe('growth collection archive', () => {
  it('preserves the original fifty slots and adds exactly fifty expedition slots', () => {
    const archive = collectionArchive({ ...base, ...expedition });
    expect(archive.categories.slice(0, 8)).toEqual([
      { id:'memories', label:'기억', current:3, total:13 },
      { id:'discoveries', label:'발견물', current:2, total:6 },
      { id:'stories', label:'이야기', current:1, total:5 },
      { id:'talents', label:'고급 재능', current:4, total:8 },
      { id:'titles', label:'칭호', current:2, total:6 },
      { id:'seasonStamps', label:'계절 인장', current:2, total:4 },
      { id:'legacyRelics', label:'레거시 유물', current:1, total:5 },
      { id:'ambitionHonors', label:'야망 휘장', current:2, total:3 },
    ]);
    expect(archive.categories.slice(8).map(item => item.total)).toEqual([9,3,6,9,9,4,4,3,3]);
    expect(archive.total).toBe(100);
  });

  it('calculates completion against one hundred slots', () => {
    const full = collectionArchive({
      memories:13, discoveries:6, stories:5, talents:8, titles:6, seasonStamps:4, legacyRelics:5, ambitionHonors:3,
      expeditionStages:9, expeditionBosses:3, expeditionRelics:6, expeditionStories:9, expeditionDiscoveries:9, guardianEvolution:4,
      expeditionCrafting:4, expeditionRegions:3, expeditionSMilestones:3,
    });
    expect(full.current).toBe(100);
    expect(full.percent).toBe(100);
  });

  it('clamps malformed counts across base and expedition categories', () => {
    const archive = collectionArchive({
      memories:99, discoveries:-2, stories:8, talents:8, titles:6, seasonStamps:9, legacyRelics:99, ambitionHonors:99,
      expeditionStages:99, expeditionBosses:-2, expeditionRelics:8, expeditionStories:22, expeditionDiscoveries:9,
      guardianEvolution:7, expeditionCrafting:9, expeditionRegions:8, expeditionSMilestones:5,
    });
    expect(archive.current).toBe(91);
    expect(archive.total).toBe(100);
  });
});
