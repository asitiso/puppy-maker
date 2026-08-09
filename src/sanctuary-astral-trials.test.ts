import { describe, expect, it } from 'vitest';
import {
  astralTrialFor,
  astralTrialPower,
  resolveAstralTrial,
} from './sanctuary-astral-trials';

describe('sanctuary astral trials', () => {
  it('rotates deterministic monthly trials', () => {
    expect(astralTrialFor(1,1).id).toBe('scholar_trial');
    expect(astralTrialFor(1,2).id).toBe('wayfarer_trial');
    expect(astralTrialFor(1,3).id).toBe('guardian_trial');
    expect(astralTrialFor(1,4).id).toBe('crown_trial');
    expect(astralTrialFor(1,5).id).toBe('scholar_trial');
  });

  it('computes trial power from growth stats and sanctuary progress', () => {
    const power = astralTrialPower({
      trial:'scholar_trial',
      stats:{ strength:40, intelligence:80, magic:70, morality:50 },
      sanctuaryProgress:45,
      constellationCount:3,
    });
    expect(power).toBe(78);
  });

  it('requires the matching constellation and grades accepted clears', () => {
    const locked = resolveAstralTrial({
      year:1,
      month:1,
      power:90,
      constellations:['dawn_compass'],
      claimedKeys:[],
    });
    expect(locked.accepted).toBe(false);
    expect(locked.reason).toBe('constellation_locked');

    const cleared = resolveAstralTrial({
      year:1,
      month:1,
      power:90,
      constellations:['dawn_compass','scholar_star'],
      claimedKeys:[],
    });
    expect(cleared).toEqual(expect.objectContaining({
      accepted:true,
      grade:'A',
      starShards:2,
      gold:150,
      key:'1-1:scholar_trial',
    }));
  });

  it('allows only one reward claim per monthly trial', () => {
    const result = resolveAstralTrial({
      year:1,
      month:1,
      power:120,
      constellations:['dawn_compass','scholar_star'],
      claimedKeys:['1-1:scholar_trial'],
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('already_claimed');
  });
});
