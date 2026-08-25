import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {
  commitHollowDangerAction,
  hollowDangerActionIds,
  resolveHollowDangerAction,
} from './hollow-danger-actions';

describe('Hollow dangerous action utility adapters',()=>{
  it('covers every canonical danger category with a concrete short-term utility',()=>{
    expect(hollowDangerActionIds).toEqual([
      'sacrifice_ally',
      'instrumentalize_bond',
      'prioritize_reward_over_civilians',
      'use_forbidden_relic',
      'depend_on_rift',
      'accept_veyr_power',
    ]);
    for(const id of hollowDangerActionIds){
      const result=resolveHollowDangerAction(id);
      expect(result.accepted).toBe(true);
      if(!result.accepted)throw new Error(`expected ${id}`);
      expect(result.definition.utility.amount).toBeGreaterThan(0);
    }
  });

  it('maps dangerous actions onto canonical evidence and existing-system utility channels',()=>{
    expect(resolveHollowDangerAction('accept_veyr_power')).toEqual({
      accepted:true,
      definition:{
        id:'accept_veyr_power',
        evidenceId:'veyr_power',
        utility:{kind:'tactical_resource',resource:'mp',amount:2},
      },
    });
    expect(resolveHollowDangerAction('prioritize_reward_over_civilians')).toMatchObject({
      accepted:true,
      definition:{evidenceId:'civilian_tradeoff',utility:{kind:'campaign_reward',resource:'gold'}},
    });
    expect(resolveHollowDangerAction('depend_on_rift')).toMatchObject({
      accepted:true,
      definition:{evidenceId:'rift_dependence',utility:{kind:'season_progress'}},
    });
  });

  it('awards the short-term utility only when canonical evidence is first recorded',()=>{
    const state=emptyCampaignRunState();
    const first=commitHollowDangerAction(state,'use_forbidden_relic');
    expect(first.committed).toBe(true);
    if(!first.committed)throw new Error('expected first dangerous action');
    expect(first.state.dangerState.evidence).toContain('forbidden_relic');
    expect(first.utility).toEqual({kind:'tactical_resource',resource:'mp',amount:2});

    const duplicate=commitHollowDangerAction(first.state,'use_forbidden_relic');
    expect(duplicate).toEqual({committed:false,state:first.state,reason:'already_applied'});
  });

  it('rejects unknown action IDs without mutation or utility',()=>{
    const state=emptyCampaignRunState();
    expect(commitHollowDangerAction(state,'free_power')).toEqual({
      committed:false,state,reason:'invalid_action',
    });
  });
});
