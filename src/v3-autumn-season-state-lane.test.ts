import {describe,expect,it} from 'vitest';
import {initialState,type GameState} from './game';
import {inspectSavedGame,serializeSavedGame} from './save-schema';
import {prepareNewRunState} from './v3-persistent-state';
import {
  commitAutumnMajorChoice,
  resolveAutumnCampaignAction,
  resolveAutumnMajorChoice,
  resolveAutumnThirdOptionEligibility,
  selectWinterCampaignInput,
} from './campaign-autumn-season';

const autumnClaim='3-autumn:vanguard:autumn_vanguard_command';

describe('V3 Autumn Lane C season/state vertical slice',()=>{
  it('persists Autumn objective claim, Major Choice, and compact Winter input through save/load/reload',()=>{
    const action=resolveAutumnCampaignAction({
      year:3,week:2,campaign:'vanguard',facts:['great_expedition_command'],claimedKeys:[],
    });
    expect(action.accepted).toBe(true);
    if(!action.accepted)return;
    expect(action.claimKey).toBe(autumnClaim);

    const eligibility=resolveAutumnThirdOptionEligibility({
      campaign:'vanguard',evidence:['ally_support','independent_command_evidence'],
    });
    expect(eligibility).toEqual({eligible:true,campaignId:'vanguard',choiceId:'coalition_command'});

    const choice=resolveAutumnMajorChoice({campaign:'vanguard',choice:'coalition_command',thirdEligible:eligibility.eligible});
    expect(choice.accepted).toBe(true);
    if(!choice.accepted)return;

    const committed=commitAutumnMajorChoice({
      ...initialState.campaignRun,
      claimedSeasonalObjectives:[action.claimKey],
      majorOutcomes:{...initialState.campaignRun.majorOutcomes,great_expedition:'costly_victory'},
    },choice);
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;

    const state={...initialState,campaignRun:committed.state} as GameState;
    const loaded=inspectSavedGame(serializeSavedGame(state));
    expect(loaded.status).toBe('valid');
    expect(loaded.state.campaignRun.claimedSeasonalObjectives).toEqual([autumnClaim]);
    expect(loaded.state.campaignRun.activeCampaign).toBe('vanguard');
    expect(loaded.state.campaignRun.majorChoices.vanguard_autumn).toBe('coalition_command');
    expect(loaded.state.campaignRun.seasonMilestones).toContain('autumn_resolved');
    expect(selectWinterCampaignInput(loaded.state.campaignRun)).toEqual({
      campaignId:'vanguard',
      autumnChoiceId:'coalition_command',
      greatExpeditionOutcome:'costly_victory',
    });

    const reloaded=inspectSavedGame(serializeSavedGame(loaded.state));
    expect(reloaded.status).toBe('valid');
    expect(reloaded.state).toEqual(loaded.state);
  });

  it('blocks duplicate Autumn objective reward and Major Choice overwrite after reload',()=>{
    const state={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        activeCampaign:'vanguard' as const,
        claimedSeasonalObjectives:[autumnClaim],
        majorChoices:{vanguard_autumn:'coalition_command' as const},
        majorOutcomes:{great_expedition:'victory' as const},
        seasonMilestones:['autumn_resolved' as const],
      },
    } as GameState;
    const loaded=inspectSavedGame(serializeSavedGame(state)).state;

    const duplicateAction=resolveAutumnCampaignAction({
      year:3,week:4,campaign:'vanguard',facts:['great_expedition_command','ally_support'],
      claimedKeys:loaded.campaignRun.claimedSeasonalObjectives,
    });
    expect(duplicateAction).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed',claimKey:autumnClaim}));

    const replay=resolveAutumnMajorChoice({campaign:'vanguard',choice:'centralize',thirdEligible:false});
    expect(replay.accepted).toBe(true);
    if(!replay.accepted)return;
    const afterReplay=commitAutumnMajorChoice(loaded.campaignRun,replay);
    expect(afterReplay.committed).toBe(false);
    expect(afterReplay.state).toBe(loaded.campaignRun);
    expect(afterReplay.state.majorChoices.vanguard_autumn).toBe('coalition_command');
  });

  it('sanitizes malformed persisted Autumn claims and choices while preserving registered Autumn history',()=>{
    const raw={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        activeCampaign:'vanguard',
        claimedSeasonalObjectives:[
          autumnClaim,
          autumnClaim,
          '03-autumn:vanguard:autumn_vanguard_command',
          '3-autumn:caretaker:autumn_vanguard_command',
          'bad',
        ],
        majorChoices:{vanguard_autumn:'not_a_choice',caretaker_autumn:'team_solution'},
        majorOutcomes:{great_expedition:'costly_victory'},
        seasonMilestones:['autumn_resolved','not_a_milestone'],
      },
    };
    const hydrated=inspectSavedGame(serializeSavedGame(raw as GameState)).state.campaignRun;
    expect(hydrated.claimedSeasonalObjectives).toEqual([autumnClaim]);
    expect(hydrated.majorChoices.vanguard_autumn).toBeUndefined();
    expect(hydrated.majorChoices.caretaker_autumn).toBe('team_solution');
    expect(hydrated.majorOutcomes.great_expedition).toBe('costly_victory');
    expect(hydrated.seasonMilestones).toEqual(['autumn_resolved']);
    expect(selectWinterCampaignInput(hydrated)).toBeNull();
  });

  it('resets Autumn run facts on a new run while preserving Legacy',()=>{
    const current={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        activeCampaign:'vanguard' as const,
        claimedSeasonalObjectives:[autumnClaim],
        majorChoices:{vanguard_autumn:'coalition_command' as const},
        majorOutcomes:{great_expedition:'victory' as const},
        seasonMilestones:['autumn_resolved' as const],
      },
    };
    const next=prepareNewRunState(current);
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.majorChoices).toEqual({});
    expect(next.campaignRun.majorOutcomes.great_expedition).toBeUndefined();
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(selectWinterCampaignInput(next.campaignRun)).toBeNull();
    expect(next.legacy).toEqual(current.legacy);
  });
});
