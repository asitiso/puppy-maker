import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,type CampaignRunState} from './campaign-state';
import {commitHollowDangerAction,resolveHollowDangerAction} from './hollow-danger-actions';
import {resolveHollowFinalChoice} from './hollow-choice';

describe('Hollow choice adapter frozen contract',()=>{
  it('keeps dangerous choices as semantic evidence + existing-system utility DTOs only',()=>{
    const state={
      ...emptyCampaignRunState(),
      phase:'summer' as const,
      activeCampaign:'caretaker' as const,
    };
    const committed=commitHollowDangerAction(state,'accept_veyr_power');
    expect(committed.committed).toBe(true);
    if(!committed.committed)throw new Error('expected dangerous choice commit');

    expect(committed.utility).toEqual({kind:'tactical_resource',resource:'mp',amount:2});
    expect(committed.state.activeRoute).toBe('normal');
    expect(committed.state.phase).toBe('summer');
    expect(committed.state.claimedSeasonalObjectives).toEqual([]);
    expect(committed.state.claimedCampaignRewards).toEqual([]);
    expect(committed.state.majorOutcomes).toEqual({});
    expect(committed.state.dangerState.evidence).toEqual(['veyr_power']);
  });

  it('exposes only the frozen existing utility channels and rejects unknown choices',()=>{
    const accepted=[
      resolveHollowDangerAction('sacrifice_ally'),
      resolveHollowDangerAction('instrumentalize_bond'),
      resolveHollowDangerAction('prioritize_reward_over_civilians'),
      resolveHollowDangerAction('use_forbidden_relic'),
      resolveHollowDangerAction('depend_on_rift'),
      resolveHollowDangerAction('accept_veyr_power'),
    ];
    expect(accepted.every(result=>result.accepted)).toBe(true);
    const kinds=accepted.flatMap(result=>result.accepted?[result.definition.utility.kind]:[]);
    expect([...new Set(kinds)].sort()).toEqual(['campaign_reward','season_progress','tactical_resource']);
    expect(resolveHollowDangerAction('new_hollow_system')).toEqual({accepted:false,reason:'invalid_action'});
  });

  it('lets explicit final choice mutate only route/resolution after canonical candidate evidence exists',()=>{
    const state:CampaignRunState={
      ...emptyCampaignRunState(),
      phase:'summer',
      activeCampaign:'caretaker',
      dangerState:{
        score:999,
        behaviors:[],
        evidence:['instrumental_bond','civilian_tradeoff','veyr_power'],
      },
    };
    const accepted=resolveHollowFinalChoice(state,'accept');
    expect(accepted.committed).toBe(true);
    if(!accepted.committed)throw new Error('expected final choice commit');

    expect(accepted.state.activeRoute).toBe('hollow');
    expect(accepted.state.dangerState.finalChoiceResolution).toBe('accepted');
    expect(accepted.state.dangerState.evidence).toEqual(state.dangerState.evidence);
    expect(accepted.state.phase).toBe(state.phase);
    expect(accepted.state.claimedSeasonalObjectives).toEqual(state.claimedSeasonalObjectives);
    expect(accepted.state.claimedCampaignRewards).toEqual(state.claimedCampaignRewards);
    expect(accepted.state.majorOutcomes).toEqual(state.majorOutcomes);
  });
});
