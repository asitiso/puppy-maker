import { describe, expect, it } from 'vitest';
import {
  applyExpeditionCallingRewards,
  applyPathfinderOutingLegend,
  effectivePathfinderExplorationXp,
  legendRewardKey,
  specialistMasteryCalling,
} from './calling-depth-effects';

describe('Calling depth effects', () => {
  it('builds stable monthly legend reward keys', () => {
    expect(legendRewardKey(2, 7, 'vanguard_legend')).toBe('2-7:vanguard_legend');
    expect(legendRewardKey(2.9, 13.4, 'vanguard_legend')).toBe('2-12:vanguard_legend');
    expect(legendRewardKey(Number.NaN, Number.POSITIVE_INFINITY, 'vanguard_legend')).toBe('1-1:vanguard_legend');
  });

  it('accelerates discovery eligibility only with a complete Pathfinder eye path', () => {
    expect(effectivePathfinderExplorationXp(3, 'pathfinder', ['pathfinder_eye'])).toBe(3);
    expect(effectivePathfinderExplorationXp(3, 'pathfinder', ['pathfinder_herb','pathfinder_eye'])).toBe(6);
    expect(effectivePathfinderExplorationXp(3, 'vanguard', ['pathfinder_herb','pathfinder_eye'])).toBe(3);
    expect(effectivePathfinderExplorationXp(Number.NaN, 'pathfinder', ['pathfinder_herb','pathfinder_eye'])).toBe(3);
    expect(effectivePathfinderExplorationXp(Number.POSITIVE_INFINITY, 'pathfinder', ['pathfinder_herb','pathfinder_eye'])).toBe(3);
    expect(effectivePathfinderExplorationXp(-4, 'pathfinder', ['pathfinder_herb','pathfinder_eye'])).toBe(3);
  });

  it('detects specialist Calling mastery from expedition actions', () => {
    expect(specialistMasteryCalling('vanguard', { attack:2, dodge:0, charge:0 }, { grade:'A', discovery:null, materialReward:1 })).toBe('vanguard');
    expect(specialistMasteryCalling('arcanist', { attack:0, dodge:0, charge:1 }, { grade:'S', discovery:null, materialReward:2 })).toBe('arcanist');
    expect(specialistMasteryCalling('caretaker', { attack:0, dodge:1, charge:0 }, { grade:'B', discovery:null, materialReward:1 })).toBe('caretaker');
    expect(specialistMasteryCalling('pathfinder', { attack:1, dodge:0, charge:0 }, { grade:'A', discovery:'forest_echo', materialReward:0 })).toBe('pathfinder');
    expect(specialistMasteryCalling('vanguard', { attack:0, dodge:2, charge:0 }, { grade:'A', discovery:null, materialReward:1 })).toBeNull();
  });

  it('does not grant Calling mastery from corrupted action counts', () => {
    expect(specialistMasteryCalling('vanguard', { attack:Number.POSITIVE_INFINITY, dodge:0, charge:0 }, { grade:'A', discovery:null, materialReward:1 })).toBeNull();
    expect(specialistMasteryCalling('arcanist', { attack:0, dodge:0, charge:Number.NaN }, { grade:'S', discovery:null, materialReward:2 })).toBeNull();
    expect(specialistMasteryCalling('caretaker', { attack:0, dodge:-1, charge:0 }, { grade:'B', discovery:null, materialReward:1 })).toBeNull();
    expect(specialistMasteryCalling('pathfinder', { attack:Number.NaN, dodge:Number.POSITIVE_INFINITY, charge:-3 }, { grade:'A', discovery:'forest_echo', materialReward:2 })).toBeNull();
  });

  it('applies Pathfinder signature rewards without duplicating the existing supply trait', () => {
    const first = applyExpeditionCallingRewards({
      year:1, month:4, calling:'pathfinder',
      traits:['pathfinder_herb','pathfinder_eye','pathfinder_supply','pathfinder_legend'],
      signatures:['trail_reading','star_compass'], legendRewardKeys:[],
      stageId:'forest_glade', grade:'S', firstClear:true, discovery:'forest_echo',
      regionCompleted:'starlight_forest', materialReward:2, fatigueDelta:8, stressDelta:6,
    });
    expect(first.extraMaterial).toBe(2); // supply +1 remains owned by raising-expedition-effects
    expect(first.goldBonus).toBe(0);
    expect(first.legendRewardKeys).toEqual([]);
  });

  it('applies Vanguard and Arcanist monthly Legend effects once with complete Trait paths', () => {
    const vanguardTraits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;
    const vanguard = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:[...vanguardTraits], signatures:[], legendRewardKeys:[],
      stageId:'forest_path', grade:'A', firstClear:true, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(vanguard.fatigueDelta).toBe(6);
    expect(vanguard.legendRewardKeys).toContain('1-4:vanguard_legend');
    const repeat = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:[...vanguardTraits], signatures:[], legendRewardKeys:vanguard.legendRewardKeys,
      stageId:'forest_glade', grade:'A', firstClear:true, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(repeat.fatigueDelta).toBe(8);

    const arcanist = applyExpeditionCallingRewards({
      year:1, month:4, calling:'arcanist', traits:['arcanist_mana','arcanist_insight','arcanist_channel','arcanist_legend'], signatures:[], legendRewardKeys:[],
      stageId:'city_square', grade:'S', firstClear:true, discovery:'city_rune', regionCompleted:null, materialReward:2, fatigueDelta:8, stressDelta:6,
    });
    expect(arcanist.stressDelta).toBe(4);
    expect(arcanist.legendRewardKeys).toContain('1-4:arcanist_legend');
  });

  it('does not activate orphaned Legend traits in expedition rewards', () => {
    const vanguard = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:['vanguard_legend'], signatures:[], legendRewardKeys:[],
      stageId:'forest_path', grade:'A', firstClear:true, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(vanguard.fatigueDelta).toBe(8);
    expect(vanguard.legendRewardKeys).toEqual([]);
    expect(vanguard.applied).toEqual([]);

    const arcanist = applyExpeditionCallingRewards({
      year:1, month:4, calling:'arcanist', traits:['arcanist_legend'], signatures:[], legendRewardKeys:[],
      stageId:'city_square', grade:'S', firstClear:true, discovery:'city_rune', regionCompleted:null, materialReward:2, fatigueDelta:8, stressDelta:6,
    });
    expect(arcanist.stressDelta).toBe(6);
    expect(arcanist.legendRewardKeys).toEqual([]);
  });

  it('requires a complete Pathfinder Legend path for the outing gold bonus', () => {
    expect(applyPathfinderOutingLegend(1, 4, 'pathfinder', ['pathfinder_legend'], true, []))
      .toEqual({ goldBonus:0, legendRewardKeys:[], applied:false });
    expect(applyPathfinderOutingLegend(1, 4, 'pathfinder', ['pathfinder_herb','pathfinder_eye','pathfinder_supply','pathfinder_legend'], true, []))
      .toEqual({ goldBonus:100, legendRewardKeys:['1-4:pathfinder_legend'], applied:true });
  });

  it('normalizes corrupted reward deltas and duplicate monthly keys', () => {
    const result = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'], signatures:[],
      legendRewardKeys:['1-4:vanguard_legend','1-4:vanguard_legend'],
      stageId:'forest_path', grade:'A', firstClear:true, discovery:null, regionCompleted:null,
      materialReward:Number.POSITIVE_INFINITY, fatigueDelta:Number.NaN, stressDelta:Number.POSITIVE_INFINITY,
    });
    expect(result.fatigueDelta).toBe(0);
    expect(result.stressDelta).toBe(0);
    expect(result.legendRewardKeys).toEqual(['1-4:vanguard_legend']);
    expect(result.applied).toEqual([]);
  });

  it('applies heart anchor stress protection whenever its signature is active', () => {
    const result = applyExpeditionCallingRewards({
      year:1, month:4, calling:'caretaker', traits:['caretaker_rest','caretaker_bond','caretaker_guard','caretaker_legend'], signatures:['heart_anchor'], legendRewardKeys:[],
      stageId:'lake_channel', grade:'A', firstClear:false, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(result.stressDelta).toBe(4);
    expect(result.applied).toContain('heart_anchor');
  });
});
