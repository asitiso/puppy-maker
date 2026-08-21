import { describe, expect, it } from 'vitest';
import {
  applyExpeditionCallingRewards,
  effectivePathfinderExplorationXp,
  legendRewardKey,
  specialistMasteryCalling,
} from './calling-depth-effects';

describe('Calling depth effects', () => {
  it('builds stable monthly legend reward keys', () => {
    expect(legendRewardKey(2, 7, 'vanguard_legend')).toBe('2-7:vanguard_legend');
    expect(legendRewardKey(Number.NaN, Number.POSITIVE_INFINITY, 'vanguard_legend')).toBe('1-1:vanguard_legend');
  });

  it('accelerates discovery eligibility only with Pathfinder eye', () => {
    expect(effectivePathfinderExplorationXp(3, 'pathfinder', ['pathfinder_eye'])).toBe(6);
    expect(effectivePathfinderExplorationXp(3, 'vanguard', ['pathfinder_eye'])).toBe(3);
    expect(effectivePathfinderExplorationXp(Number.NaN, 'pathfinder', ['pathfinder_eye'])).toBe(3);
  });

  it('detects specialist Calling mastery from expedition actions', () => {
    expect(specialistMasteryCalling('vanguard', { attack:2, dodge:0, charge:0 }, { stageId:'forest_path', grade:'A', discovery:null, materialReward:1 })).toBe('vanguard');
    expect(specialistMasteryCalling('arcanist', { attack:0, dodge:0, charge:1 }, { stageId:'forest_path', grade:'S', discovery:null, materialReward:2 })).toBe('arcanist');
    expect(specialistMasteryCalling('caretaker', { attack:0, dodge:1, charge:0 }, { stageId:'forest_path', grade:'B', discovery:null, materialReward:1 })).toBe('caretaker');
    expect(specialistMasteryCalling('pathfinder', { attack:1, dodge:0, charge:0 }, { stageId:'forest_path', grade:'A', discovery:'forest_echo', materialReward:0 })).toBe('pathfinder');
    expect(specialistMasteryCalling('vanguard', { attack:0, dodge:2, charge:0 }, { stageId:'forest_path', grade:'A', discovery:null, materialReward:1 })).toBeNull();
  });

  it('lets Pathfinder mastery progress on successful boss clears and re-clears', () => {
    expect(specialistMasteryCalling(
      'pathfinder',
      { attack:1, dodge:1, charge:1 },
      { stageId:'forest_guardian', grade:'B', discovery:null, materialReward:0 },
    )).toBe('pathfinder');
    expect(specialistMasteryCalling(
      'pathfinder',
      { attack:1, dodge:1, charge:1 },
      { stageId:'forest_guardian', grade:'C', discovery:null, materialReward:0 },
    )).toBeNull();
  });

  it('applies Pathfinder signature rewards without duplicating the existing supply trait', () => {
    const first = applyExpeditionCallingRewards({
      year:1, month:4, calling:'pathfinder',
      traits:['pathfinder_eye','pathfinder_supply','pathfinder_legend'],
      signatures:['trail_reading','star_compass'], legendRewardKeys:[],
      stageId:'forest_glade', grade:'S', firstClear:true, discovery:'forest_echo',
      regionCompleted:'starlight_forest', materialReward:2, fatigueDelta:8, stressDelta:6,
    });
    expect(first.extraMaterial).toBe(2); // supply +1 remains owned by raising-expedition-effects
    expect(first.goldBonus).toBe(0);
    expect(first.legendRewardKeys).toEqual([]);
  });

  it('applies Vanguard and Arcanist monthly Legend effects once', () => {
    const vanguard = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:['vanguard_legend'], signatures:[], legendRewardKeys:[],
      stageId:'forest_path', grade:'A', firstClear:true, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(vanguard.fatigueDelta).toBe(6);
    expect(vanguard.legendRewardKeys).toContain('1-4:vanguard_legend');
    const repeat = applyExpeditionCallingRewards({
      year:1, month:4, calling:'vanguard', traits:['vanguard_legend'], signatures:[], legendRewardKeys:vanguard.legendRewardKeys,
      stageId:'forest_glade', grade:'A', firstClear:true, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(repeat.fatigueDelta).toBe(8);

    const arcanist = applyExpeditionCallingRewards({
      year:1, month:4, calling:'arcanist', traits:['arcanist_legend'], signatures:[], legendRewardKeys:[],
      stageId:'city_square', grade:'S', firstClear:true, discovery:'city_rune', regionCompleted:null, materialReward:2, fatigueDelta:8, stressDelta:6,
    });
    expect(arcanist.stressDelta).toBe(4);
    expect(arcanist.legendRewardKeys).toContain('1-4:arcanist_legend');
  });

  it('applies heart anchor stress protection whenever its signature is active', () => {
    const result = applyExpeditionCallingRewards({
      year:1, month:4, calling:'caretaker', traits:['caretaker_legend'], signatures:['heart_anchor'], legendRewardKeys:[],
      stageId:'lake_channel', grade:'A', firstClear:false, discovery:null, regionCompleted:null, materialReward:1, fatigueDelta:8, stressDelta:6,
    });
    expect(result.stressDelta).toBe(4);
    expect(result.applied).toContain('heart_anchor');
  });

  it('sanitizes non-finite expedition burden deltas instead of returning NaN', () => {
    const result = applyExpeditionCallingRewards({
      year:1, month:4, calling:'caretaker', traits:[], signatures:['heart_anchor'], legendRewardKeys:[],
      stageId:'lake_channel', grade:'A', firstClear:false, discovery:null, regionCompleted:null, materialReward:1,
      fatigueDelta:Number.NaN, stressDelta:Number.POSITIVE_INFINITY,
    });
    expect(result.fatigueDelta).toBe(0);
    expect(result.stressDelta).toBe(0);
    expect(Number.isFinite(result.fatigueDelta)).toBe(true);
    expect(Number.isFinite(result.stressDelta)).toBe(true);
  });
});
