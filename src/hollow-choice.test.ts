import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,type CampaignRunState} from './campaign-state';
import {emptyV3PersistentState} from './v3-persistent-state';
import {initialState,reducer} from './game';
import {resolveHollowFinalChoice} from './hollow-choice';

function candidateRun():CampaignRunState{
  return {
    ...emptyCampaignRunState(),
    phase:'summer',
    activeCampaign:'caretaker',
    dangerState:{
      score:999,
      behaviors:[],
      evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
    },
  };
}

describe('Hollow explicit final choice',()=>{
  it('does not mutate route merely because the candidate opportunity exists',()=>{
    const state=candidateRun();
    expect(state.activeRoute).toBe('normal');
  });

  it('refuses explicitly, preserves the current route, and resolves the opportunity exactly once',()=>{
    const state={...candidateRun(),activeRoute:'normal' as const};
    const refused=resolveHollowFinalChoice(state,'refuse');
    expect(refused.committed).toBe(true);
    if(!refused.committed)throw new Error('expected refusal commit');
    expect(refused.state.activeRoute).toBe('normal');
    expect(refused.state.dangerState.finalChoiceResolution).toBe('refused');

    expect(resolveHollowFinalChoice(refused.state,'accept')).toEqual({
      committed:false,state:refused.state,reason:'already_resolved',
    });
  });

  it('accepts explicitly and commits the Hollow route exactly once',()=>{
    const state=candidateRun();
    const accepted=resolveHollowFinalChoice(state,'accept');
    expect(accepted.committed).toBe(true);
    if(!accepted.committed)throw new Error('expected acceptance commit');
    expect(accepted.state.activeRoute).toBe('hollow');
    expect(accepted.state.dangerState.finalChoiceResolution).toBe('accepted');
    expect(resolveHollowFinalChoice(accepted.state,'accept')).toEqual({
      committed:false,state:accepted.state,reason:'already_resolved',
    });
  });

  it('rejects acceptance without canonical current-run candidate evidence',()=>{
    const state:CampaignRunState={
      ...candidateRun(),
      dangerState:{score:999,behaviors:[],evidence:['veyr_power']},
    };
    expect(resolveHollowFinalChoice(state,'accept')).toEqual({
      committed:false,state,reason:'not_available',
    });
  });

  it('lets the game reducer commit explicit acceptance while preserving unrelated game state',()=>{
    const v3=emptyV3PersistentState();
    const state={
      ...initialState,
      ...v3,
      gold:321,
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2 as const,
      campaignRun:candidateRun(),
    };
    const next=reducer(state,{type:'RESOLVE_HOLLOW_FINAL_CHOICE',choice:'accept'});
    expect(next.campaignRun.activeRoute).toBe('hollow');
    expect(next.campaignRun.dangerState.finalChoiceResolution).toBe('accepted');
    expect(next.gold).toBe(321);
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);
  });
});
