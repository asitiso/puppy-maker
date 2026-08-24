import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {resolveHollowFinalChoice} from './hollow-choice';
import {initialState,reducer} from './game';

const candidateRun=()=>({
  ...emptyCampaignRunState(),
  phase:'summer' as const,
  activeCampaign:'caretaker' as const,
  activeRoute:'normal' as const,
  dangerState:{
    score:0,
    behaviors:[],
    evidence:['instrumental_bond','civilian_tradeoff','veyr_power'] as const,
  },
});

describe('Hollow Macro A -> B final-choice ID integration',()=>{
  it('accepts the frozen player-facing accept_hollow ID as the authoritative Hollow acceptance',()=>{
    const transition=resolveHollowFinalChoice(candidateRun(),'accept_hollow');
    expect(transition.committed).toBe(true);
    if(!transition.committed)throw new Error(`expected accept_hollow to commit, got ${transition.reason}`);
    expect(transition.resolution).toBe('accepted');
    expect(transition.state.activeRoute).toBe('hollow');
  });

  it('accepts the frozen player-facing refuse_hollow ID without changing the current route',()=>{
    const state={...initialState,campaignRun:candidateRun()};
    const next=reducer(state,{type:'RESOLVE_HOLLOW_FINAL_CHOICE',choice:'refuse_hollow'});
    expect(next.campaignRun.dangerState.finalChoiceResolution).toBe('refused');
    expect(next.campaignRun.activeRoute).toBe('normal');
  });
});
