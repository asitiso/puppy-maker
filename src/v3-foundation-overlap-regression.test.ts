import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';
import {CURRENT_SAVE_SCHEMA_VERSION,inspectSavedGame} from './save-schema';
import {tacticalEncounterDefinitions} from './tactical-encounters';

function integrityForTest(state:unknown):string{
  const serialized=JSON.stringify(state);
  let hash=0x811c9dc5;
  for(let index=0;index<serialized.length;index+=1){
    hash^=serialized.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

function v2Payload(){
  const state={...initialState} as Record<string,unknown>;
  delete state.campaignRun;
  delete state.worldHistory;
  delete state.characterBonds;
  delete state.legacy;
  state.gold=444;
  state.endingCollection=['guardian'];
  return state;
}

describe('V3 Foundation overlap regression gate',()=>{
  it('preserves current V2 finite hydration guards',()=>{
    expect(hydrateGameState({...initialState,monthsCompleted:NaN}).monthsCompleted).toBe(0);
  });

  it('preserves current V2 Tactical non-finite telemetry sanitation',()=>{
    const encounterId=tacticalEncounterDefinitions[0].id;
    const next=reducer(initialState,{
      type:'COMPLETE_TACTICAL_BATTLE',encounterId,result:'victory',rounds:NaN,survivingAllies:Infinity,damageTaken:-Infinity,
    });
    const record=next.tacticalBattleRecords[encounterId];
    expect(record).toBeDefined();
    expect(Number.isFinite(record!.bestRounds)).toBe(true);
    expect(record!.bestRounds).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(next.gold)).toBe(true);
    expect(Number.isFinite(next.gems)).toBe(true);
  });

  it('migrates only integrity-valid v2 saves into schema v3 and seeds legacy endings',()=>{
    const state=v2Payload();
    const valid=inspectSavedGame(JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state}));
    expect(CURRENT_SAVE_SCHEMA_VERSION).toBe(3);
    expect(valid.status).toBe('migrated-v2');
    expect((valid.state as any).legacy?.endingCollection).toEqual(['guardian']);

    expect(inspectSavedGame(JSON.stringify({schemaVersion:2,state})).status).toBe('integrity-failed');
    const tampered={schemaVersion:2,integrity:integrityForTest(state),state:{...state,gold:999999}};
    expect(inspectSavedGame(JSON.stringify(tampered)).status).toBe('integrity-failed');
  });

  it('keeps top-level NEW_RUN inert during Foundation',()=>{
    expect(reducer(initialState,{type:'NEW_RUN'})).toBe(initialState);
  });
});
