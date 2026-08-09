import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { sanctuaryAstralUiSummary } from './sanctuary-astral-ui';

describe('sanctuary astral ui summary', () => {
  it('summarizes the current monthly trial and lock state', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      year:1,
      month:1,
      sanctuaryConstellations:['dawn_compass'] as typeof initialState.sanctuaryConstellations,
    });
    expect(summary.trial.id).toBe('scholar_trial');
    expect(summary.trial.requiredConstellation).toBe('scholar_star');
    expect(summary.trial.unlocked).toBe(false);
    expect(summary.trial.claimed).toBe(false);
    expect(summary.trial.canChallenge).toBe(false);
  });

  it('shows power, grade preview and completed monthly trial state', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      year:1,
      month:1,
      stats:{ ...initialState.stats, intelligence:100, magic:100 },
      sanctuaryConstellations:['dawn_compass','scholar_star'] as typeof initialState.sanctuaryConstellations,
      claimedAstralTrials:['1-1:scholar_trial'],
      astralTrialRecords:[{ key:'1-1:scholar_trial', grade:'A', power:93 }],
    });
    expect(summary.trial.unlocked).toBe(true);
    expect(summary.trial.claimed).toBe(true);
    expect(summary.trial.power).toBeGreaterThan(0);
    expect(['B','A','S']).toContain(summary.trial.previewGrade);
    expect(summary.recentRecords[0]).toEqual(expect.objectContaining({ grade:'A', power:93 }));
  });

  it('summarizes star shards and permanent blessing purchase states', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      astralStarShards:5,
      claimedAstralTrials:['1-1:scholar_trial'],
      purchasedAstralBlessings:[],
    });
    expect(summary.starShards).toBe(5);
    expect(summary.blessings.find(item => item.id === 'scholar_glow')).toEqual(expect.objectContaining({
      trialCleared:true,
      purchased:false,
      canBuy:true,
    }));
    expect(summary.blessings.find(item => item.id === 'guardian_aegis')).toEqual(expect.objectContaining({ trialCleared:false, canBuy:false }));
  });
});
