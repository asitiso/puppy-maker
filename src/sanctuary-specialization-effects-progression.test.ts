import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';
import { weeklyDirectiveKey, weeklyDirectives } from './weekly-directives';

const levelThree = {
  training_hall:3 as const,
  archive_library:3 as const,
  herb_garden:3 as const,
  observatory:3 as const,
};

describe('sanctuary specialization gameplay effects', () => {
  it('warrior doctrine adds bounded training growth on top of a level-three hall', () => {
    const source = { ...initialState, sanctuaryLevels:levelThree, trainingScore:700 };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ training_hall:'warrior_doctrine' as const } },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const total = (state:typeof baseline) => state.stats.strength + state.stats.intelligence + state.stats.magic + state.stats.morality;
    expect(total(boosted)).toBeGreaterThan(total(baseline));
    expect(total(boosted) - total(baseline)).toBeLessThan(3);
  });

  it('mastery codex adds exactly one mastery xp to the trained discipline', () => {
    const source = { ...initialState, sanctuaryLevels:levelThree, trainingScore:700 };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ archive_library:'mastery_codex' as const } },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const totalXp = (state:typeof baseline) => Object.values(state.mastery).reduce((sum,item) => sum + item.xp,0);
    expect(totalXp(boosted) - totalXp(baseline)).toBe(1);
  });

  it('moonwell garden adds one more fatigue and stress recovery at month transition', () => {
    const source = { ...initialState, sanctuaryLevels:levelThree, screen:'result' as const, stats:{ ...initialState.stats, fatigue:50, stress:50 } };
    const baseline = reducer(source,{ type:'NEXT_MONTH' });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ herb_garden:'moonwell_garden' as const } },{ type:'NEXT_MONTH' });
    expect(boosted.stats.fatigue).toBe(baseline.stats.fatigue - 1);
    expect(boosted.stats.stress).toBe(baseline.stats.stress - 1);
  });

  it('bonding grove adds affection only to an explicit successful gift', () => {
    const source = { ...initialState, sanctuaryLevels:levelThree, stats:{ ...initialState.stats, affection:40 } };
    const baseline = reducer(source,{ type:'GIVE_GIFT', item:'herb_tea' });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ herb_garden:'bonding_grove' as const } },{ type:'GIVE_GIFT', item:'herb_tea' });
    expect(boosted.stats.affection).toBe(baseline.stats.affection + 1);
  });

  it('expedition array adds two journey points and keeps tier claims unique', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const source = { ...initialState, sanctuaryLevels:levelThree, seasonJourneyScores:{ [key]:18 } };
    const baseline = reducer(source,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ observatory:'expedition_array' as const } },{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(boosted.seasonJourneyScores[key]).toBe(baseline.seasonJourneyScores[key] + 2);
    expect(new Set(boosted.claimedSeasonJourneyTiers).size).toBe(boosted.claimedSeasonJourneyTiers.length);
  });

  it('living chronicle adds five journey points before month transition', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const source = { ...initialState, sanctuaryLevels:levelThree, screen:'result' as const, seasonJourneyScores:{ [key]:40 } };
    const baseline = reducer(source,{ type:'NEXT_MONTH' });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ archive_library:'living_chronicle' as const } },{ type:'NEXT_MONTH' });
    expect(boosted.seasonJourneyScores[key]).toBe((baseline.seasonJourneyScores[key] ?? 0) + 5);
  });

  it('season lens adds one token when a weekly training directive completes', () => {
    const week = ([1,2,3,4] as const).find(candidate => weeklyDirectives(initialState.year,initialState.month,candidate).some(item => item.counter === 'training'))!;
    const directives = weeklyDirectives(initialState.year,initialState.month,week);
    const trainingDirective = directives.find(item => item.counter === 'training')!;
    const weekKey = weeklyDirectiveKey(initialState.year,initialState.month,week);
    const seasonKey = seasonJourneyKey(initialState.year,initialState.month);
    const progress = Object.fromEntries(directives.map(item => [item.id,item.id === trainingDirective.id ? item.target - 1 : 0]));
    const source = {
      ...initialState,
      week,
      sanctuaryLevels:levelThree,
      weeklyDirectiveKey:weekKey,
      weeklyDirectiveProgress:progress,
      seasonTokenBalances:{ [seasonKey]:0 },
      trainingScore:700,
    };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const boosted = reducer({ ...source, sanctuarySpecializations:{ observatory:'season_lens' as const } },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(boosted.seasonTokenBalances[seasonKey]).toBe(baseline.seasonTokenBalances[seasonKey] + 1);
  });

  it('star route network adds one extra expedition journey point above expedition array alone', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const source = { ...initialState, sanctuaryLevels:levelThree, seasonJourneyScores:{ [key]:18 } };
    const direct = reducer({ ...source, sanctuarySpecializations:{ observatory:'expedition_array' as const } },{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    const synergy = reducer({ ...source, sanctuarySpecializations:{ training_hall:'adaptive_drills' as const, observatory:'expedition_array' as const } },{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(synergy.seasonJourneyScores[key]).toBe(direct.seasonJourneyScores[key] + 1);
  });
});
