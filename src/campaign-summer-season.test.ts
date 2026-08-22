import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {
  commitSummerCampaignOutcome,
  resolveSummerCampaignAction,
  resolveSummerCampaignOutcome,
} from './campaign-summer-season';

const claimed=(key:string)=>[key];

describe('V3 Summer campaign season runtime',()=>{
  it.each([
    ['caretaker',['protect'],'summer_caretaker_rescue'],
    ['pathfinder',['limited_exploration'],'summer_pathfinder_limited_route'],
    ['vanguard',['ally_survival'],'summer_vanguard_chain'],
    ['vanguard',['defeat_recovery'],'summer_vanguard_chain'],
    ['arcanist',['status_combat'],'summer_arcanist_rule_shift'],
  ] as const)('maps %s Summer action facts onto the existing seasonal objective layer', (campaign,facts,objectiveId)=>{
    const result=resolveSummerCampaignAction({year:2,week:2,campaign,facts,claimedKeys:[]});
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    expect(result.objective.id).toBe(objectiveId);
    expect(result.reward.kind).toBe('campaign_memory');
  });

  it('keeps one action to one objective and blocks duplicate fallthrough',()=>{
    const first=resolveSummerCampaignAction({
      year:2,week:1,campaign:'caretaker',facts:['protect','bond','recovery'],claimedKeys:[],
    });
    expect(first.accepted).toBe(true);
    if(!first.accepted)return;
    expect(first.objective.id).toBe('summer_caretaker_rescue');

    const duplicate=resolveSummerCampaignAction({
      year:2,week:4,campaign:'caretaker',facts:['protect','bond','recovery'],claimedKeys:claimed(first.claimKey),
    });
    expect(duplicate).toEqual(expect.objectContaining({
      accepted:false,
      reason:'already_claimed',
      claimKey:first.claimKey,
    }));
  });

  it('emits a compact Summer result for existing CampaignRun fields without opening Autumn choices',()=>{
    expect(resolveSummerCampaignOutcome({campaign:'pathfinder',outcome:'costly_victory'})).toEqual({
      accepted:true,
      campaignId:'pathfinder',
      majorEvent:'guardian_festival',
      outcome:'costly_victory',
      milestone:'summer_resolved',
    });
    expect(resolveSummerCampaignOutcome({campaign:'true_path',outcome:'victory'})).toEqual({accepted:false,reason:'invalid_result'});
    expect(resolveSummerCampaignOutcome({campaign:'vanguard',outcome:'unknown'})).toEqual({accepted:false,reason:'invalid_result'});
  });

  it('commits Summer result once and never lets replay overwrite authoritative history',()=>{
    const initial=emptyCampaignRunState();
    const victory=resolveSummerCampaignOutcome({campaign:'vanguard',outcome:'victory'});
    expect(victory.accepted).toBe(true);
    if(!victory.accepted)return;
    const committed=commitSummerCampaignOutcome(initial,victory);
    expect(committed.majorOutcomes.guardian_festival).toBe('victory');
    expect(committed.seasonMilestones).toEqual(['summer_resolved']);

    const replay=resolveSummerCampaignOutcome({campaign:'vanguard',outcome:'defeat'});
    expect(replay.accepted).toBe(true);
    if(!replay.accepted)return;
    const afterReplay=commitSummerCampaignOutcome(committed,replay);
    expect(afterReplay).toBe(committed);
    expect(afterReplay.majorOutcomes.guardian_festival).toBe('victory');
    expect(afterReplay.seasonMilestones).toEqual(['summer_resolved']);
  });

  it('rejects malformed context and unsupported cross-campaign facts',()=>{
    expect(resolveSummerCampaignAction({year:0,week:1,campaign:'caretaker',facts:['protect'],claimedKeys:[]}))
      .toEqual({accepted:false,reason:'invalid_context'});
    expect(resolveSummerCampaignAction({year:1,week:1,campaign:'vanguard',facts:['protect'],claimedKeys:[]}))
      .toEqual({accepted:false,reason:'no_match'});
  });
});
