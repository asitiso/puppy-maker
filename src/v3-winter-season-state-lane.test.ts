import {describe,expect,it} from 'vitest';
import {initialState,type GameState} from './game';
import {inspectSavedGame,serializeSavedGame} from './save-schema';
import {prepareNewRunState} from './v3-persistent-state';
import {
  commitLongNightOutcome,
  commitWinterEnding,
  resolveLongNightOutcome,
  resolveModularEnding,
  resolveWinterCampaignAction,
  selectCompletedRunHandoff,
} from './campaign-winter-season';

const winterClaim='4-winter:vanguard:winter_vanguard_command';

function resolvedVanguardEnding(){
  const result=resolveModularEnding({
    campaignResolution:'coalition_guardianship',
    bondResolution:'rex_mutual_trust',
    worldResolution:'survived_with_cost',
    careerResolution:'guardian_captain',
  });
  expect(result.accepted).toBe(true);
  if(!result.accepted)throw new Error('expected modular ending');
  return result.ending;
}

describe('V3 Winter Lane C season/state vertical slice',()=>{
  it('persists Winter objective, Long Night result, modular ending, and compact completed-run handoff across reload',()=>{
    const action=resolveWinterCampaignAction({
      year:4,week:2,campaign:'vanguard',facts:['long_night_command'],claimedKeys:[],
    });
    expect(action.accepted).toBe(true);
    if(!action.accepted)return;
    expect(action.claimKey).toBe(winterClaim);

    const outcome=resolveLongNightOutcome({campaign:'vanguard',outcome:'costly_victory'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;

    const longNight=commitLongNightOutcome({
      ...initialState.campaignRun,
      phase:'winter',
      activeCampaign:'vanguard',
      claimedSeasonalObjectives:[action.claimKey],
      majorChoices:{vanguard_autumn:'coalition_command'},
      majorOutcomes:{great_expedition:'victory'},
      seasonMilestones:['autumn_resolved'],
    },outcome);
    expect(longNight.committed).toBe(true);
    if(!longNight.committed)return;

    const ending=resolvedVanguardEnding();
    const committed=commitWinterEnding({
      ...initialState,
      campaignRun:longNight.state,
      worldHistory:{currentFacts:['coalition_command'],inheritedFacts:[]},
    },ending,{
      majorWorldOutcomes:['coalition_command'],
      keyBondMemories:[{characterId:'rex',memoryId:'rex_autumn_coalition_command'}],
      trueClues:['vanguard_hidden_conflict_record'],
    });
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;

    const loaded=inspectSavedGame(serializeSavedGame(committed.state as GameState));
    expect(loaded.status).toBe('valid');
    expect(loaded.state.campaignRun.claimedSeasonalObjectives).toEqual([winterClaim]);
    expect(loaded.state.campaignRun.majorOutcomes.long_night).toBe('costly_victory');
    expect(loaded.state.campaignRun.seasonMilestones).toEqual(['autumn_resolved','winter_resolved','ending_committed']);
    expect(loaded.state.legacy.completedRuns).toBe(1);
    expect(loaded.state.legacy.endingCollection).toEqual([ending.id]);
    expect(loaded.state.legacy.runSummaries).toHaveLength(1);
    expect(selectCompletedRunHandoff(loaded.state)).toEqual({
      runNumber:1,
      campaignId:'vanguard',
      route:'normal',
      longNightOutcome:'costly_victory',
      endingId:ending.id,
      dimensions:ending.dimensions,
    });

    const reloaded=inspectSavedGame(serializeSavedGame(loaded.state));
    expect(reloaded.status).toBe('valid');
    expect(reloaded.state).toEqual(loaded.state);
  });

  it('blocks Winter reward, Long Night result, and ending replacement after save/load',()=>{
    const ending=resolvedVanguardEnding();
    const state={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        phase:'ending' as const,
        activeCampaign:'vanguard' as const,
        claimedSeasonalObjectives:[winterClaim],
        majorChoices:{vanguard_autumn:'coalition_command' as const},
        majorOutcomes:{great_expedition:'victory' as const,long_night:'costly_victory' as const},
        seasonMilestones:['autumn_resolved' as const,'winter_resolved' as const,'ending_committed' as const],
      },
      legacy:{
        ...initialState.legacy,
        completedRuns:1,
        completedCampaigns:['vanguard' as const],
        endingCollection:[ending.id],
        careerCollection:['guardian_captain'],
        runSummaries:[{
          runNumber:1,
          campaign:'vanguard' as const,
          route:'normal' as const,
          ending:ending.id,
          career:'guardian_captain',
          majorWorldOutcomes:['coalition_command' as const],
          keyBondMemories:[{characterId:'rex' as const,memoryId:'rex_autumn_coalition_command' as const}],
          trueClues:['vanguard_hidden_conflict_record' as const],
        }],
      },
    } as GameState;
    const loaded=inspectSavedGame(serializeSavedGame(state)).state;

    const duplicateAction=resolveWinterCampaignAction({
      year:4,week:4,campaign:'vanguard',facts:['long_night_command','elite_chain'],
      claimedKeys:loaded.campaignRun.claimedSeasonalObjectives,
    });
    expect(duplicateAction).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed',claimKey:winterClaim}));

    const replayOutcome=resolveLongNightOutcome({campaign:'vanguard',outcome:'victory'});
    expect(replayOutcome.accepted).toBe(true);
    if(!replayOutcome.accepted)return;
    const afterOutcomeReplay=commitLongNightOutcome(loaded.campaignRun,replayOutcome);
    expect(afterOutcomeReplay).toEqual({committed:false,state:loaded.campaignRun,reason:'already_committed'});

    const different=resolveModularEnding({
      campaignResolution:'central_command',bondResolution:'rex_rivalry',worldResolution:'victory',careerResolution:'commander',
    });
    expect(different.accepted).toBe(true);
    if(!different.accepted)return;
    const afterEndingReplay=commitWinterEnding(loaded,different.ending);
    expect(afterEndingReplay).toEqual({committed:false,state:loaded,reason:'already_committed'});
  });

  it('persists defeat fail-forward and sanitizes malformed Winter claims and malformed completed-run handoff',()=>{
    const outcome=resolveLongNightOutcome({campaign:'caretaker',outcome:'defeat'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    const defeated=commitLongNightOutcome({
      ...initialState.campaignRun,
      phase:'winter',
      activeCampaign:'caretaker',
      seasonMilestones:['autumn_resolved'],
    },outcome);
    expect(defeated.committed).toBe(true);
    if(!defeated.committed)return;
    const defeatLoaded=inspectSavedGame(serializeSavedGame({...initialState,campaignRun:defeated.state} as GameState)).state;
    expect(defeatLoaded.campaignRun.majorOutcomes.long_night).toBe('defeat');
    expect(defeatLoaded.campaignRun.failForwardOutcomes).toContain('long_night');
    expect(defeatLoaded.campaignRun.seasonMilestones).toContain('winter_resolved');

    const raw={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        phase:'ending',
        activeCampaign:'vanguard',
        claimedSeasonalObjectives:[
          winterClaim,
          winterClaim,
          '04-winter:vanguard:winter_vanguard_command',
          '4-winter:caretaker:winter_vanguard_command',
          'bad',
        ],
        majorOutcomes:{great_expedition:'victory',long_night:'victory'},
        seasonMilestones:['autumn_resolved','winter_resolved','ending_committed'],
      },
      legacy:{
        ...initialState.legacy,
        completedRuns:1,
        completedCampaigns:['vanguard'],
        endingCollection:['broken-ending'],
        careerCollection:['guardian_captain'],
        runSummaries:[{
          runNumber:1,
          campaign:'vanguard',
          route:'normal',
          ending:'broken-ending',
          career:'guardian_captain',
          majorWorldOutcomes:['coalition_command'],
          keyBondMemories:[{characterId:'rex',memoryId:'rex_autumn_coalition_command'}],
          trueClues:['vanguard_hidden_conflict_record'],
        }],
      },
    } as GameState;
    const hydrated=inspectSavedGame(serializeSavedGame(raw)).state;
    expect(hydrated.campaignRun.claimedSeasonalObjectives).toEqual([winterClaim]);
    expect(hydrated.campaignRun.majorOutcomes.long_night).toBe('victory');
    expect(hydrated.campaignRun.seasonMilestones).toEqual(['autumn_resolved','winter_resolved','ending_committed']);
    expect(selectCompletedRunHandoff(hydrated)).toBeNull();
  });

  it('clears Winter run state on new run while preserving the completed Legacy record',()=>{
    const ending=resolvedVanguardEnding();
    const current={
      ...initialState,
      campaignRun:{
        ...initialState.campaignRun,
        phase:'ending' as const,
        activeCampaign:'vanguard' as const,
        claimedSeasonalObjectives:[winterClaim],
        majorOutcomes:{great_expedition:'victory' as const,long_night:'victory' as const},
        seasonMilestones:['autumn_resolved' as const,'winter_resolved' as const,'ending_committed' as const],
      },
      legacy:{
        ...initialState.legacy,
        completedRuns:1,
        completedCampaigns:['vanguard' as const],
        endingCollection:[ending.id],
        careerCollection:['guardian_captain'],
        runSummaries:[{
          runNumber:1,
          campaign:'vanguard' as const,
          route:'normal' as const,
          ending:ending.id,
          career:'guardian_captain',
          majorWorldOutcomes:['coalition_command' as const],
          keyBondMemories:[{characterId:'rex' as const,memoryId:'rex_autumn_coalition_command' as const}],
          trueClues:['vanguard_hidden_conflict_record' as const],
        }],
      },
    };
    const next=prepareNewRunState(current);
    expect(next.campaignRun.activeCampaign).toBeNull();
    expect(next.campaignRun.claimedSeasonalObjectives).toEqual([]);
    expect(next.campaignRun.majorOutcomes.long_night).toBeUndefined();
    expect(next.campaignRun.failForwardOutcomes).toEqual([]);
    expect(next.campaignRun.seasonMilestones).toEqual([]);
    expect(next.legacy).toEqual(current.legacy);
    expect(selectCompletedRunHandoff(next)).toBeNull();
  });
});
