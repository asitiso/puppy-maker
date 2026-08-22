import {describe,expect,it} from 'vitest';
import type {MainCampaignId} from './campaign-model';
import {initialState,reducer,type GameState} from './game';
import {deriveSpringAffinityEvidence,springPathCandidates} from './v3-spring-integration';

const campaignTraining:Record<MainCampaignId,'rest'|'herb'|'hunt'|'magic'>={
  caretaker:'rest',
  pathfinder:'herb',
  vanguard:'hunt',
  arcanist:'magic',
};

function highCampaignTrainingState(campaign:MainCampaignId):GameState{
  const activity=campaignTraining[campaign];
  return {
    ...initialState,
    month:4,
    week:2,
    mastery:{
      ...initialState.mastery,
      [activity]:{xp:999},
    },
  };
}

function highVanguardTrainingState():GameState{
  return highCampaignTrainingState('vanguard');
}

function committedCampaignState(campaign:MainCampaignId):GameState{
  const opened=reducer(highCampaignTrainingState(campaign),{type:'OPEN_SPRING_PATH_CONVERGENCE'} as never);
  return reducer(opened,{type:'COMMIT_SPRING_CAMPAIGN',campaign} as never);
}

function committedVanguardState():GameState{
  return committedCampaignState('vanguard');
}

describe('V3 Spring shared integration',()=>{
  it('derives capped affinity from persisted play and opens deterministic mid-Spring Path Convergence',()=>{
    const played=highVanguardTrainingState();
    const candidates=springPathCandidates(played);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.length).toBeLessThanOrEqual(3);
    expect(candidates[0].campaign).toBe('vanguard');

    const opened=reducer(played,{type:'OPEN_SPRING_PATH_CONVERGENCE'} as never);
    expect(opened.campaignRun.phase).toBe('path_selection');
    expect(opened.campaignRun.seasonMilestones).toContain('path_convergence');
    expect(opened.campaignRun.campaignAffinities.vanguard).toBe(6);
  });

  it('does not open convergence before the checkpoint or after Spring',()=>{
    const early={...highVanguardTrainingState(),month:3,week:4};
    const summer={...highVanguardTrainingState(),month:6,week:1};
    expect(reducer(early,{type:'OPEN_SPRING_PATH_CONVERGENCE'} as never).campaignRun.phase).toBe('spring_exploration');
    expect(reducer(summer,{type:'OPEN_SPRING_PATH_CONVERGENCE'} as never).campaignRun.phase).toBe('spring_exploration');
  });

  it('commits only a current candidate and applies First Commitment bond exactly once',()=>{
    const opened=reducer(highVanguardTrainingState(),{type:'OPEN_SPRING_PATH_CONVERGENCE'} as never);
    const rejected=reducer(opened,{type:'COMMIT_SPRING_CAMPAIGN',campaign:'pathfinder'} as never);
    expect(rejected.campaignRun.activeCampaign).toBeNull();
    expect(rejected.campaignRun.phase).toBe('path_selection');

    const beforeTrust=opened.characterBonds.rex.trust;
    const committed=reducer(opened,{type:'COMMIT_SPRING_CAMPAIGN',campaign:'vanguard'} as never);
    expect(committed.campaignRun.activeCampaign).toBe('vanguard');
    expect(committed.campaignRun.phase).toBe('summer');
    expect(committed.characterBonds.rex.trust).toBe(beforeTrust+3);
    expect(committed.characterBonds.rex.memories).toContain('rex_first_commitment');

    const duplicate=reducer(committed,{type:'COMMIT_SPRING_CAMPAIGN',campaign:'vanguard'} as never);
    expect(duplicate.campaignRun).toEqual(committed.campaignRun);
    expect(duplicate.characterBonds).toEqual(committed.characterBonds);
  });

  it('reconstructs distinct Calling, Personality, dialogue, Bond, exploration, Tactical and training evidence from persisted play',()=>{
    const played:GameState={
      ...initialState,
      activeCalling:'arcanist',
      personality:{...initialState.personality,curiosity:26},
      lastChoice:'hug',
      stats:{...initialState.stats,affection:90},
      discoveries:['moon_feather','tiny_bell'],
      mastery:{...initialState.mastery,hunt:{xp:5}},
      tacticalBattleRecords:{training_duel:{grade:'A',bestRounds:4,clearCount:2}} as never,
    };
    const evidence=deriveSpringAffinityEvidence(played);
    expect(new Set(evidence.filter(item=>item.amount>0).map(item=>item.source))).toEqual(new Set([
      'training','dialogue','bond','exploration','tactical','calling','personality',
    ]));
    expect(springPathCandidates(played).map(item=>item.campaign)).toEqual(['caretaker','pathfinder','vanguard']);
  });

  it('claims the matching Spring seasonal objective once from an existing Tactical victory and never activates Summer objectives',()=>{
    const committed=committedVanguardState();
    const action={
      type:'COMPLETE_TACTICAL_BATTLE' as const,
      encounterId:'training_ground' as const,
      result:'victory' as const,
      rounds:3,
      survivingAllies:3,
      damageTaken:20,
    };
    const claimed=reducer(committed,action);
    expect(claimed.campaignRun.claimedSeasonalObjectives).toEqual([
      '1-spring:vanguard:spring_vanguard_challenge',
    ]);
    const duplicate=reducer(claimed,action);
    expect(duplicate.campaignRun.claimedSeasonalObjectives).toEqual(claimed.campaignRun.claimedSeasonalObjectives);

    const summer={...committed,month:6,week:1};
    expect(reducer(summer,action).campaignRun.claimedSeasonalObjectives).toEqual([]);
  });

  it('translates existing dialogue and outing actions into Spring seasonal signals without adding new chores',()=>{
    const caretaker=committedCampaignState('caretaker');
    const cared=reducer(caretaker,{type:'CHOOSE',choice:'hug'} as never);
    expect(cared.campaignRun.claimedSeasonalObjectives).toEqual([
      '1-spring:caretaker:spring_caretaker_bond',
    ]);
    expect(reducer(cared,{type:'CHOOSE',choice:'hug'} as never).campaignRun.claimedSeasonalObjectives).toEqual(
      cared.campaignRun.claimedSeasonalObjectives,
    );

    const pathfinder=committedCampaignState('pathfinder');
    const explored=reducer(pathfinder,{type:'GO_OUTING',location:'forest'} as never);
    expect(explored.campaignRun.claimedSeasonalObjectives).toEqual([
      '1-spring:pathfinder:spring_pathfinder_discovery',
    ]);
  });
});