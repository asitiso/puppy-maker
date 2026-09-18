import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState} from './v3-persistent-state';
import {advanceFifthPathJourney,fifthPathJourneyActionForChoice} from './fifth-path-journey';

function truePathState(){
  const state=emptyV3PersistentState();
  return {...state,campaignRun:{...state.campaignRun,activeCampaign:'true_path' as const,phase:'summer' as const,seasonMilestones:['path_convergence' as const]}};
}

describe('Fifth Path journey progression',()=>{
  it('advances the authoritative run through Summer, Autumn, Long Night and ending exactly once',()=>{
    const summer=truePathState();
    const autumn=advanceFifthPathJourney(summer,'resolve_summer');
    expect(autumn.advanced).toBe(true);
    if(!autumn.advanced)return;
    expect(autumn.state.campaignRun.phase).toBe('autumn');
    expect(autumn.state.campaignRun.seasonMilestones).toEqual(['path_convergence','summer_resolved']);
    expect(advanceFifthPathJourney(autumn.state,'resolve_summer').advanced).toBe(false);

    const winter=advanceFifthPathJourney(autumn.state,'rewrite_the_pattern');
    expect(winter.advanced).toBe(true);
    if(!winter.advanced)return;
    expect(winter.state.campaignRun.phase).toBe('winter');

    const ending=advanceFifthPathJourney(winter.state,'resolve_long_night');
    expect(ending.advanced).toBe(true);
    if(!ending.advanced)return;
    expect(ending.state.campaignRun.phase).toBe('ending');
    expect(ending.state.campaignRun.majorOutcomes.long_night).toBe('victory');

    const committed=advanceFifthPathJourney(ending.state,'commit_true_ending');
    expect(committed.advanced).toBe(true);
    if(!committed.advanced)return;
    expect(committed.state.campaignRun.seasonMilestones).toContain('ending_committed');
    expect(advanceFifthPathJourney(committed.state,'commit_true_ending').advanced).toBe(false);
  });

  it('preserves an existing authoritative Long Night outcome',()=>{
    const state=truePathState();
    const autumn=advanceFifthPathJourney(state,'resolve_summer');
    if(!autumn.advanced)return;
    const winter=advanceFifthPathJourney(autumn.state,'rewrite_the_pattern');
    if(!winter.advanced)return;
    const withOutcome={...winter.state,campaignRun:{...winter.state.campaignRun,majorOutcomes:{...winter.state.campaignRun.majorOutcomes,long_night:'costly_victory' as const}}};
    const ending=advanceFifthPathJourney(withOutcome,'resolve_long_night');
    expect(ending.advanced&&ending.state.campaignRun.majorOutcomes.long_night).toBe('costly_victory');
  });

  it('rejects out-of-order and non true-path progression',()=>{
    const normal=emptyV3PersistentState();
    expect(advanceFifthPathJourney(normal,'resolve_summer').advanced).toBe(false);
    expect(advanceFifthPathJourney(truePathState(),'rewrite_the_pattern').advanced).toBe(false);
  });

  it('maps visible VN choices onto canonical journey actions without accepting arbitrary text',()=>{
    expect(fifthPathJourneyActionForChoice('원인을 더 깊이 추적한다')).toBe('resolve_summer');
    expect(fifthPathJourneyActionForChoice('정답을 반복하지 않고 새로운 합의를 만든다')).toBe('rewrite_the_pattern');
    expect(fifthPathJourneyActionForChoice('긴 밤을 끝낸다')).toBe('resolve_long_night');
    expect(fifthPathJourneyActionForChoice('새로운 봄을 맞는다')).toBe('commit_true_ending');
    expect(fifthPathJourneyActionForChoice('아무 선택')).toBeNull();
  });
});
