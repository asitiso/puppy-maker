import {describe,expect,it} from 'vitest';
import {initialState,type GameState} from './game';
import {inspectSavedGame,serializeSavedGame} from './save-schema';
import {
  commitSummerCampaignOutcome,
  resolveSummerCampaignAction,
  resolveSummerCampaignOutcome,
} from './campaign-summer-season';
import {prepareNewRunState} from './v3-persistent-state';

const summerClaim='2-summer:vanguard:summer_vanguard_chain';

describe('V3 Summer Lane C season/state vertical slice',()=>{
  it('persists Summer objective claim and compact campaign result through save/load/reload',()=>{
    const action=resolveSummerCampaignAction({
      year:2,week:2,campaign:'vanguard',facts:['ally_survival'],claimedKeys:[],
    });
    expect(action.accepted).toBe(true);
    if(!action.accepted)return;
    expect(action.claimKey).toBe(summerClaim);

    const outcome=resolveSummerCampaignOutcome({campaign:'vanguard',outcome:'costly_victory'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;

    const campaignRun=commitSummerCampaignOutcome({
      ...initialState.campaignRun,
      claimedSeasonalObjectives:[action.claimKey],
    },outcome);
    const state={...initialState,campaignRun} as GameState;

    const loaded=inspectSavedGame(serializeSavedGame(state));
    expect(loaded.status).toBe('valid');
    expect(loaded.state.campaignRun.claimedSeasonalObjectives).toEqual([summerClaim]);
    expect(loaded.state.campaignRun.majorOutcomes.guardian_festival).toBe('costly_victory');
    expect(loaded.state.campaignRun.seasonMilestones).toContain('summer_resolved');

    const reloaded=inspectSavedGame(serializeSavedGame(loaded.state));
    expect(reloaded.status).toBe('valid');
    expect(reloaded.state).toEqual(loaded.state);
  });

  it('blocks duplicate objective reward and Summer result overwrite after reload',()=>{
    const state={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        claimedSeasonalObjectives:[summerClaim],
        majorOutcomes:{...initialState.campaignRun.majorOutcomes,guardian_festival:'victory' as const},
        seasonMilestones:['summer_resolved' as const],
      },
    } as GameState;
    const loaded=inspectSavedGame(serializeSavedGame(state)).state;

    const duplicate=resolveSummerCampaignAction({
      year:2,week:4,campaign:'vanguard',facts:['ally_survival','defeat_recovery'],
      claimedKeys:loaded.campaignRun.claimedSeasonalObjectives,
    });
    expect(duplicate).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed',claimKey:summerClaim}));

    const replay=resolveSummerCampaignOutcome({campaign:'vanguard',outcome:'defeat'});
    expect(replay.accepted).toBe(true);
    if(!replay.accepted)return;
    const afterReplay=commitSummerCampaignOutcome(loaded.campaignRun,replay);
    expect(afterReplay).toBe(loaded.campaignRun);
    expect(afterReplay.majorOutcomes.guardian_festival).toBe('victory');
  });

  it('sanitizes malformed persisted Summer claims/results and preserves only registered Autumn inputs',()=>{
    const raw={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        claimedSeasonalObjectives:[summerClaim,summerClaim,'02-summer:vanguard:summer_vanguard_chain','bad'],
        majorOutcomes:{guardian_festival:'unknown'},
        seasonMilestones:['summer_resolved','not_a_milestone'],
        majorChoices:{vanguard_autumn:'not_a_choice'},
      },
    };
    const hydrated=inspectSavedGame(serializeSavedGame(raw as GameState)).state.campaignRun;
    expect(hydrated.claimedSeasonalObjectives).toEqual([summerClaim]);
    expect(hydrated.majorOutcomes.guardian_festival).toBeUndefined();
    expect(hydrated.seasonMilestones).toEqual(['summer_resolved']);
    expect(hydrated.majorChoices.vanguard_autumn).toBeUndefined();
  });

  it('resets Summer run facts on a new run while preserving Legacy',()=>{
    const current={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        claimedSeasonalObjectives:[summerClaim],
        majorOutcomes:{...initialState.campaignRun.majorOutcomes,guardian_festival:'victory' as const},
        seasonMilestones:['summer_resolved' as const],
      },
    };
    const next=prepareNewRunState(current);
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.majorOutcomes.guardian_festival).toBeUndefined();
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.legacy).toEqual(current.legacy);
  });
});
