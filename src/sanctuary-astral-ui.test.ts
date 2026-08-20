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

  it('shows an unlocked fallback trial instead of a locked featured trial', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      year:1,
      month:2,
      sanctuaryConstellations:['dawn_compass','scholar_star'] as typeof initialState.sanctuaryConstellations,
      claimedAstralTrials:[],
    });

    expect(summary.trial.id).toBe('scholar_trial');
    expect(summary.trial.unlocked).toBe(true);
    expect(summary.trial.claimed).toBe(false);
    expect(summary.trial.canChallenge).toBe(true);
  });

  it('shows the month as claimed after a fallback clear even if the featured trial unlocks later', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      year:1,
      month:2,
      sanctuaryConstellations:['dawn_compass','scholar_star','wayfarer_star'] as typeof initialState.sanctuaryConstellations,
      claimedAstralTrials:['1-2:scholar_trial'],
    });

    expect(summary.trial.id).toBe('wayfarer_trial');
    expect(summary.trial.unlocked).toBe(true);
    expect(summary.trial.claimed).toBe(true);
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

  it('summarizes celestial ascension rank, components and reward track', () => {
    const summary = sanctuaryAstralUiSummary({
      ...initialState,
      astralTrialRecords:[
        { key:'1-1:scholar_trial', grade:'S', power:110 },
        { key:'1-2:wayfarer_trial', grade:'A', power:90 },
        { key:'1-3:guardian_trial', grade:'S', power:108 },
      ],
      purchasedAstralBlessings:['scholar_glow','wayfarer_wind'] as typeof initialState.purchasedAstralBlessings,
      sanctuaryConstellations:['dawn_compass','scholar_star','wayfarer_star','guardian_star'] as typeof initialState.sanctuaryConstellations,
      claimedCelestialAscensionRanks:['awakened'] as typeof initialState.claimedCelestialAscensionRanks,
    });
    expect(summary.ascension.rank).toEqual(expect.objectContaining({ id:'stellar' }));
    expect(summary.ascension.components).toEqual(expect.objectContaining({
      trialClears:3,
      uniqueSClears:2,
      blessings:2,
      constellations:4,
    }));
    expect(summary.ascension.rewards.find(item => item.rank === 'awakened')).toEqual(expect.objectContaining({ claimed:true }));
    expect(summary.ascension.nextReward).toEqual(expect.objectContaining({ rank:'stellar' }));
  });
});
