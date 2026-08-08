import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

const levels = (facility:'training_hall'|'archive_library'|'herb_garden'|'observatory',level:1|2|3) => ({
  ...initialState.sanctuaryLevels,
  [facility]:level,
});

describe('starlight sanctuary gameplay effects', () => {
  it('training hall level three adds bounded growth on completed training', () => {
    const source = { ...initialState, trainingScore:700 };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const boosted = reducer({ ...source, sanctuaryLevels:levels('training_hall',3) },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const baselineTotal = baseline.stats.strength + baseline.stats.intelligence + baseline.stats.magic + baseline.stats.morality;
    const boostedTotal = boosted.stats.strength + boosted.stats.intelligence + boosted.stats.magic + boosted.stats.morality;
    expect(boostedTotal).toBeGreaterThan(baselineTotal);
    expect(boostedTotal - baselineTotal).toBeLessThan(2);
  });

  it('archive library gives one additional mastery xp without doubling at level three', () => {
    const source = { ...initialState, trainingScore:700 };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const level2 = reducer({ ...source, sanctuaryLevels:levels('archive_library',2) },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const level3 = reducer({ ...source, sanctuaryLevels:levels('archive_library',3) },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const baselineXp = Object.values(baseline.mastery).reduce((sum,item) => sum + item.xp,0);
    const level2Xp = Object.values(level2.mastery).reduce((sum,item) => sum + item.xp,0);
    const level3Xp = Object.values(level3.mastery).reduce((sum,item) => sum + item.xp,0);
    expect(level2Xp - baselineXp).toBe(1);
    expect(level3Xp - baselineXp).toBe(1);
  });

  it('herb garden adds bounded recovery on next month', () => {
    const source = { ...initialState, screen:'result' as const, stats:{ ...initialState.stats, fatigue:50, stress:50 } };
    const baseline = reducer(source,{ type:'NEXT_MONTH' });
    const boosted = reducer({ ...source, sanctuaryLevels:levels('herb_garden',3) },{ type:'NEXT_MONTH' });
    expect(boosted.stats.fatigue).toBe(baseline.stats.fatigue - 2);
    expect(boosted.stats.stress).toBe(baseline.stats.stress - 1);
  });

  it('observatory adds expedition journey points and still pays crossed tiers once', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const source = { ...initialState, seasonJourneyScores:{ [key]:18 } };
    const baseline = reducer(source,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    const boosted = reducer({ ...source, sanctuaryLevels:levels('observatory',3) },{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(boosted.seasonJourneyScores[key]).toBe(baseline.seasonJourneyScores[key] + 3);
    expect(boosted.lastLiveOpsProgress?.journeyPoints).toBe((baseline.lastLiveOpsProgress?.journeyPoints ?? 0) + 3);
    expect(new Set(boosted.claimedSeasonJourneyTiers).size).toBe(boosted.claimedSeasonJourneyTiers.length);
  });
});
