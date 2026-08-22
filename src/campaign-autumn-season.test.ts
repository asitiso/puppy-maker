import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {
  commitAutumnMajorChoice,
  resolveAutumnCampaignAction,
  resolveAutumnMajorChoice,
  resolveAutumnThirdOptionEligibility,
  selectWinterCampaignInput,
} from './campaign-autumn-season';

describe('V3 Autumn campaign season runtime',()=>{
  it.each([
    ['caretaker',['great_expedition_protect'],'autumn_caretaker_guardianship'],
    ['pathfinder',['great_expedition_discovery'],'autumn_pathfinder_route'],
    ['vanguard',['great_expedition_command'],'autumn_vanguard_command'],
    ['arcanist',['great_expedition_relic'],'autumn_arcanist_relic'],
  ] as const)('maps %s Great Expedition facts into an Autumn seasonal objective', (campaign,facts,objectiveId)=>{
    const result=resolveAutumnCampaignAction({year:3,week:2,campaign,facts,claimedKeys:[]});
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    expect(result.objective.id).toBe(objectiveId);
    expect(result.claimKey).toBe(`3-autumn:${campaign}:${objectiveId}`);
  });

  it('keeps one Autumn action to one objective and blocks duplicate fallthrough across week rollover',()=>{
    const first=resolveAutumnCampaignAction({
      year:3,week:1,campaign:'caretaker',facts:['great_expedition_protect','bond_support'],claimedKeys:[],
    });
    expect(first.accepted).toBe(true);
    if(!first.accepted)return;

    const duplicate=resolveAutumnCampaignAction({
      year:3,week:4,campaign:'caretaker',facts:['great_expedition_protect','bond_support'],claimedKeys:[first.claimKey],
    });
    expect(duplicate).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed',claimKey:first.claimKey}));
  });

  it.each([
    ['caretaker',['bond_support','protected_civilians'],'team_solution'],
    ['pathfinder',['discovery_evidence','limited_route_evidence'],'limited_access'],
    ['vanguard',['ally_support','independent_command_evidence'],'coalition_command'],
    ['arcanist',['relic_control_evidence','astral_mastery'],'controlled_use'],
  ] as const)('unlocks only the earned third option for %s from typed prior evidence', (campaign,evidence,thirdChoice)=>{
    expect(resolveAutumnThirdOptionEligibility({campaign,evidence})).toEqual({
      eligible:true,
      campaignId:campaign,
      choiceId:thirdChoice,
    });
    expect(resolveAutumnThirdOptionEligibility({campaign,evidence:[evidence[0]]})).toEqual({
      eligible:false,
      campaignId:campaign,
      choiceId:thirdChoice,
    });
  });

  it('allows either base choice, rejects an unearned third choice, and rejects cross-campaign choice IDs',()=>{
    expect(resolveAutumnMajorChoice({campaign:'caretaker',choice:'save_one',thirdEligible:false})).toEqual(expect.objectContaining({accepted:true,choiceId:'save_one'}));
    expect(resolveAutumnMajorChoice({campaign:'caretaker',choice:'spread_risk',thirdEligible:false})).toEqual(expect.objectContaining({accepted:true,choiceId:'spread_risk'}));
    expect(resolveAutumnMajorChoice({campaign:'caretaker',choice:'team_solution',thirdEligible:false})).toEqual({accepted:false,reason:'choice_locked'});
    expect(resolveAutumnMajorChoice({campaign:'caretaker',choice:'limited_access',thirdEligible:true})).toEqual({accepted:false,reason:'invalid_choice'});
  });

  it('commits a Major Choice exactly once, establishes campaign identity when absent, and blocks conflicting replay',()=>{
    const choice=resolveAutumnMajorChoice({campaign:'vanguard',choice:'coalition_command',thirdEligible:true});
    expect(choice.accepted).toBe(true);
    if(!choice.accepted)return;

    const first=commitAutumnMajorChoice(emptyCampaignRunState(),choice);
    expect(first.committed).toBe(true);
    expect(first.state.activeCampaign).toBe('vanguard');
    expect(first.state.majorChoices.vanguard_autumn).toBe('coalition_command');
    expect(first.state.seasonMilestones).toContain('autumn_resolved');

    const replay=resolveAutumnMajorChoice({campaign:'vanguard',choice:'centralize',thirdEligible:false});
    expect(replay.accepted).toBe(true);
    if(!replay.accepted)return;
    const second=commitAutumnMajorChoice(first.state,replay);
    expect(second.committed).toBe(false);
    expect(second.state).toBe(first.state);
    expect(second.state.majorChoices.vanguard_autumn).toBe('coalition_command');
  });

  it('refuses to commit a choice for a campaign that conflicts with activeCampaign',()=>{
    const state={...emptyCampaignRunState(),activeCampaign:'caretaker' as const};
    const choice=resolveAutumnMajorChoice({campaign:'arcanist',choice:'destroy_relic',thirdEligible:false});
    expect(choice.accepted).toBe(true);
    if(!choice.accepted)return;
    expect(commitAutumnMajorChoice(state,choice)).toEqual({committed:false,state,reason:'campaign_conflict'});
  });

  it('emits only compact registered Winter input after Autumn is authoritatively resolved',()=>{
    const state={
      ...emptyCampaignRunState(),
      activeCampaign:'pathfinder' as const,
      majorChoices:{pathfinder_autumn:'limited_access' as const},
      majorOutcomes:{great_expedition:'costly_victory' as const},
      seasonMilestones:['autumn_resolved' as const],
    };
    expect(selectWinterCampaignInput(state)).toEqual({
      campaignId:'pathfinder',
      autumnChoiceId:'limited_access',
      greatExpeditionOutcome:'costly_victory',
    });
    expect(selectWinterCampaignInput(emptyCampaignRunState())).toBeNull();
  });

  it('rejects malformed campaign/action/evidence/choice input without opening True Campaign',()=>{
    expect(resolveAutumnCampaignAction({year:3,week:1,campaign:'true_path',facts:['great_expedition_protect'],claimedKeys:[]})).toEqual({accepted:false,reason:'invalid_context'});
    expect(resolveAutumnCampaignAction({year:3,week:1,campaign:'vanguard',facts:['great_expedition_protect'],claimedKeys:[]})).toEqual({accepted:false,reason:'no_match'});
    expect(resolveAutumnThirdOptionEligibility({campaign:'true_path',evidence:['bond_support']})).toEqual({eligible:false,reason:'invalid_campaign'});
    expect(resolveAutumnMajorChoice({campaign:'true_path',choice:'save_one',thirdEligible:true})).toEqual({accepted:false,reason:'invalid_choice'});
  });
});
