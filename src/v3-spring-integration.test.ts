import {describe,expect,it} from 'vitest';
import {initialState,reducer,type GameState} from './game';
import {springPathCandidates} from './v3-spring-integration';

function highVanguardTrainingState():GameState{
  return {
    ...initialState,
    month:4,
    week:2,
    mastery:{
      ...initialState.mastery,
      hunt:{xp:999},
    },
  };
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
});