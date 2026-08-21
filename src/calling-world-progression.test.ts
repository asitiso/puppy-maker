import { describe, expect, it } from 'vitest';
import {
  applyExpeditionCallingRewards,
  specialistMasteryCalling,
} from './calling-depth-effects';

const failedSummary = {
  stageId:'forest_guardian' as const,
  grade:'C' as const,
  discovery:null,
  materialReward:0,
};

describe('Calling effects on expedition world progression', () => {
  it('never grants specialist mastery from a failed C expedition', () => {
    expect(specialistMasteryCalling('pathfinder', { attack:1, dodge:1, charge:1 }, failedSummary)).toBeNull();
    expect(specialistMasteryCalling('vanguard', { attack:3, dodge:0, charge:0 }, failedSummary)).toBeNull();
    expect(specialistMasteryCalling('arcanist', { attack:0, dodge:0, charge:3 }, failedSummary)).toBeNull();
  });

  it('does not grant Pathfinder success rewards from stale success fields on a C expedition', () => {
    const result = applyExpeditionCallingRewards({
      year:1,
      month:4,
      calling:'pathfinder',
      traits:['pathfinder_legend'],
      signatures:['trail_reading','star_compass'],
      legendRewardKeys:[],
      stageId:'forest_guardian',
      grade:'C',
      firstClear:true,
      discovery:null,
      regionCompleted:'starlight_forest',
      materialReward:2,
      fatigueDelta:8,
      stressDelta:6,
    });

    expect(result.extraMaterial).toBe(0);
    expect(result.legendRewardKeys).toEqual([]);
    expect(result.applied).toEqual([]);
  });

  it('does not consume the Vanguard monthly legend reward from a stale firstClear on C', () => {
    const result = applyExpeditionCallingRewards({
      year:1,
      month:4,
      calling:'vanguard',
      traits:['vanguard_legend'],
      signatures:[],
      legendRewardKeys:[],
      stageId:'forest_guardian',
      grade:'C',
      firstClear:true,
      discovery:null,
      regionCompleted:null,
      materialReward:0,
      fatigueDelta:8,
      stressDelta:6,
    });

    expect(result.fatigueDelta).toBe(8);
    expect(result.legendRewardKeys).toEqual([]);
    expect(result.applied).toEqual([]);
  });

  it('does not consume the Arcanist monthly legend reward on C even with stale discovery data', () => {
    const result = applyExpeditionCallingRewards({
      year:1,
      month:4,
      calling:'arcanist',
      traits:['arcanist_legend'],
      signatures:[],
      legendRewardKeys:[],
      stageId:'city_square',
      grade:'C',
      firstClear:true,
      discovery:'city_square_discovery',
      regionCompleted:null,
      materialReward:2,
      fatigueDelta:8,
      stressDelta:6,
    });

    expect(result.stressDelta).toBe(6);
    expect(result.legendRewardKeys).toEqual([]);
    expect(result.applied).toEqual([]);
  });
});
