import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { CURRENT_SAVE_SCHEMA_VERSION, createSaveEnvelope, hydrateSavedGame } from './save-schema';

describe('versioned save schema', () => {
  it('wraps current game state in a versioned envelope', () => {
    const state = { ...initialState, gold:1234, gems:7 };
    const envelope = createSaveEnvelope(state);
    expect(envelope.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(envelope.state.gold).toBe(1234);
    expect(envelope.state.gems).toBe(7);
  });

  it('migrates unversioned legacy saves without losing current progression', () => {
    const legacy = {
      ...initialState,
      gold:777,
      regionalRenown:{ starlight_forest:13, ancient_city:2, wind_lakes:0 },
      expeditionSeasonScores:{ '1-spring':88 },
    };
    const hydrated = hydrateSavedGame(legacy);
    expect(hydrated.gold).toBe(777);
    expect(hydrated.regionalRenown.starlight_forest).toBe(13);
    expect(hydrated.expeditionSeasonScores['1-spring']).toBe(88);
  });

  it('sanitizes corrupted values inside a current envelope', () => {
    const hydrated = hydrateSavedGame({
      schemaVersion:CURRENT_SAVE_SCHEMA_VERSION,
      state:{
        ...initialState,
        gold:-500,
        regionalRenown:{ starlight_forest:-9, ancient_city:'bad', wind_lakes:5.8 },
        worldContractProgress:{ expedition_clear:-2, high_grade:2.9, featured_region:'bad' },
      },
    });
    expect(hydrated.gold).toBe(0);
    expect(hydrated.regionalRenown).toEqual({ starlight_forest:0, ancient_city:0, wind_lakes:5 });
    expect(hydrated.worldContractProgress).toEqual({ expedition_clear:0, high_grade:2, featured_region:0 });
  });

  it('best-effort hydrates known fields from a future schema version', () => {
    const hydrated = hydrateSavedGame({
      schemaVersion:CURRENT_SAVE_SCHEMA_VERSION + 50,
      state:{ ...initialState, gems:42, unknownFutureField:{ value:true } },
    });
    expect(hydrated.gems).toBe(42);
    expect('unknownFutureField' in hydrated).toBe(false);
  });

  it('falls back safely for malformed envelopes', () => {
    expect(hydrateSavedGame({ schemaVersion:CURRENT_SAVE_SCHEMA_VERSION })).toEqual(initialState);
    expect(hydrateSavedGame(null)).toEqual(initialState);
  });
});
