import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game-sanctuary-celestial-base';

describe('celestial record game progression', () => {
  it('hydrates only valid celestial honor ids', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedCelestialHonors:['first_light','bad','first_light','perfect_cycle'],
    });
    expect(hydrated.claimedCelestialHonors).toEqual(['first_light','perfect_cycle']);
  });

  it('auto-grants first-light honor after the first accepted astral trial', () => {
    const state = {
      ...initialState,
      year:1,
      month:1,
      stats:{ ...initialState.stats, intelligence:100, magic:100 },
      sanctuaryConstellations:['dawn_compass','scholar_star'] as typeof initialState.sanctuaryConstellations,
    };
    const next = reducer(state,{ type:'CHALLENGE_ASTRAL_TRIAL' });
    expect(next.claimedCelestialHonors).toContain('first_light');
    expect(next.astralStarShards).toBeGreaterThan(0);
    expect(next.gold).toBeGreaterThan(state.gold);
  });

  it('does not repeat celestial honor rewards on unrelated actions', () => {
    const state = { ...initialState, claimedCelestialHonors:['first_light'] as typeof initialState.claimedCelestialHonors };
    const next = reducer(state,{ type:'GO', screen:'schedule' });
    expect(next.claimedCelestialHonors).toEqual(['first_light']);
  });
});
