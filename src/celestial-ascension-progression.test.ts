import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('celestial ascension progression', () => {
  it('hydrates only valid claimed ascension reward ranks', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedCelestialAscensionRanks:['awakened','bad','awakened','transcendent'],
    });
    expect(hydrated.claimedCelestialAscensionRanks).toEqual(['awakened','transcendent']);
  });

  it('auto-grants an ascension reward when an astral blessing crosses the threshold', () => {
    const trialKey = '1-1:scholar_trial';
    const ready = {
      ...initialState,
      astralStarShards:10,
      claimedAstralTrials:[trialKey],
      astralTrialRecords:[{ key:trialKey, grade:'B' as const, power:80 }],
      sanctuaryConstellations:['dawn_compass','scholar_star','wayfarer_star'] as typeof initialState.sanctuaryConstellations,
    };
    const next = reducer(ready,{ type:'PURCHASE_ASTRAL_BLESSING', blessing:'scholar_glow' });
    expect(next.purchasedAstralBlessings).toContain('scholar_glow');
    expect(next.claimedCelestialAscensionRanks).toEqual(['awakened']);
    expect(next.gold).toBe(ready.gold + 250);
    expect(next.astralStarShards).toBe(8);
  });

  it('does not pay an ascension rank twice when the underlying action is rejected', () => {
    const trialKey = '1-1:scholar_trial';
    const ready = {
      ...initialState,
      gold:777,
      astralStarShards:8,
      claimedAstralTrials:[trialKey],
      astralTrialRecords:[{ key:trialKey, grade:'B' as const, power:80 }],
      purchasedAstralBlessings:['scholar_glow'] as typeof initialState.purchasedAstralBlessings,
      sanctuaryConstellations:['dawn_compass','scholar_star','wayfarer_star'] as typeof initialState.sanctuaryConstellations,
      claimedCelestialAscensionRanks:['awakened'] as typeof initialState.claimedCelestialAscensionRanks,
    };
    const next = reducer(ready,{ type:'PURCHASE_ASTRAL_BLESSING', blessing:'scholar_glow' });
    expect(next).toBe(ready);
    expect(next.gold).toBe(777);
  });
});
