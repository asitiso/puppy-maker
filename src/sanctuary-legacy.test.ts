import { describe,expect,it } from 'vitest';
import { legacyPathEffects,legacyRank,legacyScore } from './sanctuary-legacy';

describe('sanctuary legacy',()=>{
  it('bounds the weighted score and maps rank thresholds',()=>{
    expect(legacyScore({convergence:0,boons:0,grand:0,ascension:0,calling:0,rifts:0})).toBe(0);
    expect(legacyScore({convergence:1,boons:1,grand:1,ascension:1,calling:1,rifts:1})).toBe(100);
    expect(legacyRank(0).id).toBe('hearth');
    expect(legacyRank(20).id).toBe('beacon');
    expect(legacyRank(40).id).toBe('chronicle');
    expect(legacyRank(65).id).toBe('mythic');
    expect(legacyRank(85).id).toBe('eternal');
  });
  it('keeps paths focused and modest',()=>{
    expect(legacyPathEffects('mentor')).toEqual({trainingPercent:5,expeditionJourney:0,convergenceJourney:0,monthlyJourney:0,fatigueRecovery:0,stressRecovery:0});
    expect(legacyPathEffects('wayfarer').expeditionJourney).toBe(2);
    expect(legacyPathEffects('keeper')).toEqual(expect.objectContaining({monthlyJourney:2,fatigueRecovery:2,stressRecovery:2}));
    expect(legacyPathEffects(null).trainingPercent).toBe(0);
  });
});
