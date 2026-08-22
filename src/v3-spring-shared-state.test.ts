import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,hydrateCampaignRunState} from './campaign-state';
import {initialState,type GameState} from './game';
import {createSaveEnvelope,inspectSavedGame,serializeSavedGame} from './save-schema';
import {prepareNewRunState} from './v3-persistent-state';

const validSpringClaim='1-spring:vanguard:spring_vanguard_challenge';
const validSummerClaim='2-summer:caretaker:summer_caretaker_rescue';

describe('V3 Spring shared seasonal objective persistence',()=>{
  it('defaults the dedicated claim ledger and canonicalizes duplicate, malformed, stale and mismatched keys',()=>{
    expect((emptyCampaignRunState() as any).claimedSeasonalObjectives).toEqual([]);

    const hydrated=hydrateCampaignRunState({
      claimedSeasonalObjectives:[
        validSpringClaim,
        validSpringClaim,
        validSummerClaim,
        '0-spring:vanguard:spring_vanguard_challenge',
        '1-winter:vanguard:spring_vanguard_challenge',
        '1-spring:caretaker:spring_vanguard_challenge',
        '1-spring:vanguard:stale_objective',
        42,
        null,
      ],
    }) as any;

    expect(hydrated.claimedSeasonalObjectives).toEqual([validSpringClaim,validSummerClaim]);
  });

  it('round-trips the ledger through schema v3 save/load idempotently',()=>{
    const state={
      ...initialState,
      campaignRun:{...initialState.campaignRun,claimedSeasonalObjectives:[validSpringClaim]},
    } as GameState;

    const first=inspectSavedGame(serializeSavedGame(state));
    expect(first.status).toBe('valid');
    expect(first.schemaVersion).toBe(3);
    expect((first.state.campaignRun as any).claimedSeasonalObjectives).toEqual([validSpringClaim]);

    const second=inspectSavedGame(serializeSavedGame(first.state));
    expect(second.status).toBe('valid');
    expect(second.state).toEqual(first.state);
  });

  it('starts V2 migration empty and resets the ledger with CampaignRunState on a new run',()=>{
    const legacyV2State={...initialState,campaignRun:{...initialState.campaignRun}};
    const v2Envelope={...createSaveEnvelope(legacyV2State),schemaVersion:2};
    const migrated=inspectSavedGame(JSON.stringify(v2Envelope));
    expect(migrated.status).toBe('migrated-v2');
    expect((migrated.state.campaignRun as any).claimedSeasonalObjectives).toEqual([]);

    const current={
      ...initialState,
      campaignRun:{...initialState.campaignRun,claimedSeasonalObjectives:[validSpringClaim]},
    } as GameState;
    const nextRun=prepareNewRunState(current);
    expect((nextRun.campaignRun as any).claimedSeasonalObjectives).toEqual([]);
    expect(nextRun.legacy).toEqual(current.legacy);
  });
});
