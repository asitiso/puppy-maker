import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import {emptyV3PersistentState} from './v3-persistent-state';
import {
  commitLongNightOutcome,
  commitWinterEnding,
  resolveLongNightOutcome,
  resolveModularEnding,
  resolveWinterCampaignAction,
  selectCompletedRunHandoff,
} from './campaign-winter-season';

describe('V3 Winter campaign season + ending runtime',()=>{
  it.each([
    ['caretaker',['long_night_protection'],'winter_caretaker_protection'],
    ['pathfinder',['long_night_route'],'winter_pathfinder_route'],
    ['vanguard',['long_night_command'],'winter_vanguard_command'],
    ['arcanist',['long_night_reality'],'winter_arcanist_reality'],
  ] as const)('maps %s Long Night participation into a Winter objective', (campaign,facts,objectiveId)=>{
    const result=resolveWinterCampaignAction({year:4,week:2,campaign,facts,claimedKeys:[]});
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    expect(result.objective.id).toBe(objectiveId);
    expect(result.claimKey).toBe(`4-winter:${campaign}:${objectiveId}`);
  });

  it('keeps one Winter action to one objective and blocks duplicate fallthrough across week rollover',()=>{
    const first=resolveWinterCampaignAction({
      year:4,week:1,campaign:'caretaker',facts:['long_night_protection','responsibility_sharing'],claimedKeys:[],
    });
    expect(first.accepted).toBe(true);
    if(!first.accepted)return;
    expect(first.objective.id).toBe('winter_caretaker_protection');

    const duplicate=resolveWinterCampaignAction({
      year:4,week:4,campaign:'caretaker',facts:['long_night_protection','responsibility_sharing'],claimedKeys:[first.claimKey],
    });
    expect(duplicate).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed',claimKey:first.claimKey}));
  });

  it('registers canonical Winter claims and sanitizes stale or malformed variants',()=>{
    expect(sanitizeCampaignSeasonalObjectiveClaimKeys([
      '4-winter:caretaker:winter_caretaker_protection',
      '4-winter:caretaker:winter_caretaker_protection',
      '04-winter:caretaker:winter_caretaker_protection',
      '4-winter:caretaker:winter_vanguard_command',
      '4-winter:caretaker:stale',
    ])).toEqual(['4-winter:caretaker:winter_caretaker_protection']);
  });

  it('rejects malformed Winter objective context and True Campaign input',()=>{
    expect(resolveWinterCampaignAction({year:4,week:1,campaign:'true_path',facts:['long_night_protection'],claimedKeys:[]})).toEqual({accepted:false,reason:'invalid_context'});
    expect(resolveWinterCampaignAction({year:0,week:1,campaign:'caretaker',facts:['long_night_protection'],claimedKeys:[]})).toEqual({accepted:false,reason:'invalid_context'});
    expect(resolveWinterCampaignAction({year:4,week:5,campaign:'caretaker',facts:['long_night_protection'],claimedKeys:[]})).toEqual({accepted:false,reason:'invalid_context'});
  });

  it('commits defeat as a valid fail-forward Long Night outcome and resolves Winter',()=>{
    const state={
      ...emptyCampaignRunState(),
      phase:'winter' as const,
      activeCampaign:'caretaker' as const,
      seasonMilestones:['autumn_resolved' as const],
    };
    const outcome=resolveLongNightOutcome({campaign:'caretaker',outcome:'defeat'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;

    const committed=commitLongNightOutcome(state,outcome);
    expect(committed.committed).toBe(true);
    expect(committed.state.majorOutcomes.long_night).toBe('defeat');
    expect(committed.state.seasonMilestones).toEqual(['autumn_resolved','winter_resolved']);
    expect(committed.state.failForwardOutcomes).toContain('long_night');
    expect(committed.state.phase).toBe('ending');
  });

  it('blocks conflicting or repeated Long Night outcome commits',()=>{
    const ready={
      ...emptyCampaignRunState(),
      phase:'winter' as const,
      activeCampaign:'vanguard' as const,
      seasonMilestones:['autumn_resolved' as const],
    };
    const firstOutcome=resolveLongNightOutcome({campaign:'vanguard',outcome:'costly_victory'});
    expect(firstOutcome.accepted).toBe(true);
    if(!firstOutcome.accepted)return;
    const first=commitLongNightOutcome(ready,firstOutcome);
    expect(first.committed).toBe(true);

    const replayOutcome=resolveLongNightOutcome({campaign:'vanguard',outcome:'victory'});
    expect(replayOutcome.accepted).toBe(true);
    if(!replayOutcome.accepted)return;
    const replay=commitLongNightOutcome(first.state,replayOutcome);
    expect(replay).toEqual({committed:false,state:first.state,reason:'already_committed'});

    const conflictOutcome=resolveLongNightOutcome({campaign:'caretaker',outcome:'victory'});
    expect(conflictOutcome.accepted).toBe(true);
    if(!conflictOutcome.accepted)return;
    expect(commitLongNightOutcome(ready,conflictOutcome)).toEqual({committed:false,state:ready,reason:'campaign_conflict'});
  });

  it('requires Autumn resolution and registered Long Night outcome input',()=>{
    const state={...emptyCampaignRunState(),phase:'winter' as const,activeCampaign:'arcanist' as const};
    const outcome=resolveLongNightOutcome({campaign:'arcanist',outcome:'victory'});
    expect(outcome.accepted).toBe(true);
    if(!outcome.accepted)return;
    expect(commitLongNightOutcome(state,outcome)).toEqual({committed:false,state,reason:'not_ready'});
    expect(resolveLongNightOutcome({campaign:'true_path',outcome:'victory'})).toEqual({accepted:false,reason:'invalid_outcome'});
    expect(resolveLongNightOutcome({campaign:'arcanist',outcome:'perfect'})).toEqual({accepted:false,reason:'invalid_outcome'});
  });

  it('composes a stable four-axis ending without owning feature-specific interpretation',()=>{
    const result=resolveModularEnding({
      campaignResolution:'coalition_guardianship',
      bondResolution:'rex_mutual_trust',
      worldResolution:'survived_with_cost',
      careerResolution:'guardian_captain',
    });
    expect(result).toEqual({
      accepted:true,
      ending:{
        id:'v3:coalition_guardianship:rex_mutual_trust:survived_with_cost:guardian_captain',
        dimensions:{
          campaign:'coalition_guardianship',
          bond:'rex_mutual_trust',
          world:'survived_with_cost',
          career:'guardian_captain',
        },
      },
    });
  });

  it('rejects malformed modular ending dimension IDs',()=>{
    expect(resolveModularEnding({
      campaignResolution:'Coalition Guardianship',
      bondResolution:'rex_mutual_trust',
      worldResolution:'survived_with_cost',
      careerResolution:'guardian_captain',
    })).toEqual({accepted:false,reason:'invalid_dimension'});
    expect(resolveModularEnding({
      campaignResolution:'coalition_guardianship',
      bondResolution:'',
      worldResolution:'survived_with_cost',
      careerResolution:'guardian_captain',
    })).toEqual({accepted:false,reason:'invalid_dimension'});
  });

  it('commits the modular ending exactly once into existing Legacy summary structures',()=>{
    const persistent=emptyV3PersistentState();
    const winterReady={
      ...persistent,
      campaignRun:{
        ...persistent.campaignRun,
        phase:'ending' as const,
        activeCampaign:'vanguard' as const,
        majorChoices:{vanguard_autumn:'coalition_command' as const},
        majorOutcomes:{great_expedition:'victory' as const,long_night:'costly_victory' as const},
        seasonMilestones:['autumn_resolved' as const,'winter_resolved' as const],
      },
      worldHistory:{currentFacts:['coalition_command' as const],inheritedFacts:[]},
    };
    const resolved=resolveModularEnding({
      campaignResolution:'coalition_guardianship',
      bondResolution:'rex_mutual_trust',
      worldResolution:'survived_with_cost',
      careerResolution:'guardian_captain',
    });
    expect(resolved.accepted).toBe(true);
    if(!resolved.accepted)return;

    const committed=commitWinterEnding(winterReady,resolved.ending,{
      majorWorldOutcomes:['coalition_command','bad'] as any,
      keyBondMemories:[
        {characterId:'rex',memoryId:'rex_autumn_coalition_command'},
        {characterId:'rex',memoryId:'bad'},
      ] as any,
      trueClues:['vanguard_hidden_conflict_record','bad'] as any,
    });
    expect(committed.committed).toBe(true);
    expect(committed.state.campaignRun.seasonMilestones).toEqual(['autumn_resolved','winter_resolved','ending_committed']);
    expect(committed.state.campaignRun.phase).toBe('ending');
    expect(committed.state.legacy.completedRuns).toBe(1);
    expect(committed.state.legacy.completedCampaigns).toEqual(['vanguard']);
    expect(committed.state.legacy.endingCollection).toEqual([resolved.ending.id]);
    expect(committed.state.legacy.careerCollection).toEqual(['guardian_captain']);
    expect(committed.state.legacy.runSummaries).toEqual([{
      runNumber:1,
      campaign:'vanguard',
      route:'normal',
      ending:resolved.ending.id,
      career:'guardian_captain',
      majorWorldOutcomes:['coalition_command'],
      keyBondMemories:[{characterId:'rex',memoryId:'rex_autumn_coalition_command'}],
      trueClues:['vanguard_hidden_conflict_record'],
    }]);

    const different=resolveModularEnding({
      campaignResolution:'central_command',
      bondResolution:'rex_rivalry',
      worldResolution:'victory',
      careerResolution:'commander',
    });
    expect(different.accepted).toBe(true);
    if(!different.accepted)return;
    expect(commitWinterEnding(committed.state,different.ending)).toEqual({
      committed:false,
      state:committed.state,
      reason:'already_committed',
    });
  });

  it('refuses ending commit before authoritative Winter resolution',()=>{
    const state=emptyV3PersistentState();
    const resolved=resolveModularEnding({
      campaignResolution:'shared_guardianship',bondResolution:'mira_trust',worldResolution:'survived',careerResolution:'healer',
    });
    expect(resolved.accepted).toBe(true);
    if(!resolved.accepted)return;
    expect(commitWinterEnding(state,resolved.ending)).toEqual({committed:false,state,reason:'not_ready'});
  });

  it('exposes only a compact completed-run handoff after ending commit',()=>{
    const persistent=emptyV3PersistentState();
    const winterReady={
      ...persistent,
      campaignRun:{
        ...persistent.campaignRun,
        phase:'ending' as const,
        activeCampaign:'caretaker' as const,
        majorChoices:{caretaker_autumn:'team_solution' as const},
        majorOutcomes:{great_expedition:'victory' as const,long_night:'defeat' as const},
        failForwardOutcomes:['long_night' as const],
        seasonMilestones:['autumn_resolved' as const,'winter_resolved' as const],
      },
    };
    expect(selectCompletedRunHandoff(winterReady)).toBeNull();

    const resolved=resolveModularEnding({
      campaignResolution:'shared_guardianship',bondResolution:'mira_shared_burden',worldResolution:'survived_at_cost',careerResolution:'healer',
    });
    expect(resolved.accepted).toBe(true);
    if(!resolved.accepted)return;
    const committed=commitWinterEnding(winterReady,resolved.ending);
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;
    expect(selectCompletedRunHandoff(committed.state)).toEqual({
      runNumber:1,
      campaignId:'caretaker',
      route:'normal',
      longNightOutcome:'defeat',
      endingId:resolved.ending.id,
      dimensions:resolved.ending.dimensions,
    });
  });
});
