import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  createSaveEnvelope,
  hydrateSavedGame,
  inspectSavedGame,
  parseSavedGame,
  serializeSavedGame,
} from './save-schema';

describe('versioned save schema', () => {
  it('wraps current game state in a versioned envelope with integrity metadata', () => {
    const state = { ...initialState, gold:1234, gems:7 };
    const envelope = createSaveEnvelope(state);
    expect(CURRENT_SAVE_SCHEMA_VERSION).toBe(2);
    expect(envelope.schemaVersion).toBe(2);
    expect(envelope.state.gold).toBe(1234);
    expect(envelope.state.gems).toBe(7);
    expect(envelope.integrity).toMatch(/^[0-9a-f]{8}$/);
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

  it('migrates schema v1 envelopes that predate integrity metadata', () => {
    const hydrated = hydrateSavedGame({ schemaVersion:1, state:{ ...initialState, gold:321 } });
    expect(hydrated.gold).toBe(321);
  });

  it('sanitizes corrupted values inside a valid current envelope', () => {
    const envelope = createSaveEnvelope({ ...initialState, gold:500 });
    const serialized = serializeSavedGame({ ...envelope.state, gold:-500, regionalRenown:{ starlight_forest:-9, ancient_city:0, wind_lakes:5.8 }, worldContractProgress:{ expedition_clear:-2, high_grade:2.9, featured_region:0 } });
    const hydrated = parseSavedGame(serialized);
    expect(hydrated.gold).toBe(0);
    expect(hydrated.regionalRenown).toEqual({ starlight_forest:0, ancient_city:0, wind_lakes:5 });
    expect(hydrated.worldContractProgress).toEqual({ expedition_clear:0, high_grade:2, featured_region:0 });
  });

  it('detects a parseable current save whose state was tampered after serialization', () => {
    const envelope = JSON.parse(serializeSavedGame({ ...initialState, gold:900 }));
    envelope.state.gold = 999999;
    const inspection = inspectSavedGame(JSON.stringify(envelope));
    expect(inspection.status).toBe('integrity-failed');
    expect(inspection.state).toEqual(initialState);
  });

  it('best-effort hydrates known fields from a future schema version', () => {
    const hydrated = hydrateSavedGame({
      schemaVersion:CURRENT_SAVE_SCHEMA_VERSION + 50,
      state:{ ...initialState, gems:42, unknownFutureField:{ value:true } },
    });
    expect(hydrated.gems).toBe(42);
    expect('unknownFutureField' in hydrated).toBe(false);
  });

  it('reports malformed serialized saves distinctly from a fresh save', () => {
    expect(inspectSavedGame('{broken').status).toBe('invalid-json');
    expect(inspectSavedGame(null).status).toBe('missing');
    expect(hydrateSavedGame({ schemaVersion:CURRENT_SAVE_SCHEMA_VERSION })).toEqual(initialState);
  });
});
