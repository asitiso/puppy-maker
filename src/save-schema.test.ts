import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { emptyCampaignRunState } from './campaign-state';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  createSaveEnvelope,
  hydrateSavedGame,
  inspectSavedGame,
  parseSavedGame,
  serializeSavedGame,
} from './save-schema';

function integrityForTest(state:unknown):string{
  const serialized=JSON.stringify(state);
  let hash=0x811c9dc5;
  for(let index=0;index<serialized.length;index+=1){
    hash^=serialized.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

function v2State(){
  const {campaignRun,worldHistory,characterBonds,legacy,...state}=initialState;
  void campaignRun;void worldHistory;void characterBonds;void legacy;
  return {...state,gold:444,endingCollection:['guardian']};
}

describe('versioned save schema', () => {
  it('wraps current game state in a versioned envelope with integrity metadata', () => {
    const state = { ...initialState, gold:1234, gems:7 };
    const envelope = createSaveEnvelope(state);
    expect(CURRENT_SAVE_SCHEMA_VERSION).toBe(3);
    expect(envelope.schemaVersion).toBe(3);
    expect(envelope.state.gold).toBe(1234);
    expect(envelope.state.gems).toBe(7);
    expect(envelope.integrity).toMatch(/^[0-9a-f]{8}$/);
  });

  it('validates v2 integrity before migration and seeds V3 defaults/history',()=>{
    const state=v2State();
    const serialized=JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state});
    const inspection=inspectSavedGame(serialized);
    expect(inspection.status).toBe('migrated-v2');
    expect(inspection.state.gold).toBe(444);
    expect(inspection.state.campaignRun).toEqual(emptyCampaignRunState());
    expect(inspection.state.legacy.endingCollection).toEqual(['guardian']);
    expect(parseSavedGame(serializeSavedGame(inspection.state))).toEqual(inspection.state);
  });

  it('rejects a tampered v2 envelope instead of migrating it',()=>{
    const state=v2State();
    const envelope={schemaVersion:2,integrity:integrityForTest(state),state};
    envelope.state.gold=999999;
    expect(inspectSavedGame(JSON.stringify(envelope)).status).toBe('integrity-failed');
  });

  it('rejects a v2 envelope with missing integrity',()=>{
    expect(inspectSavedGame(JSON.stringify({schemaVersion:2,state:v2State()})).status).toBe('integrity-failed');
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
