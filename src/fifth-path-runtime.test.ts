import {describe,expect,it} from 'vitest';
import {emptyV3PersistentState,hydrateV3PersistentState} from './v3-persistent-state';
import {commitFifthSeasonObjective,resolveFifthSeasonObjective} from './fifth-path-runtime';

function truePathState(){
  const base=emptyV3PersistentState();
  return {
    ...base,
    campaignRun:{
      ...base.campaignRun,
      runNumber:5,
      phase:'summer' as const,
      activeCampaign:'true_path' as const,
      seasonMilestones:['path_convergence' as const],
    },
    worldHistory:{currentFacts:[],inheritedFacts:['festival_saved' as const]},
  };
}

describe('V3 Fifth Path seasonal runtime',()=>{
  it('advances Summer -> Autumn -> Winter through one canonical objective per season',()=>{
    let state=truePathState();
    const summer=resolveFifthSeasonObjective({year:5,season:'summer',source:'echo_convergence',state});
    expect(summer.accepted).toBe(true);
    if(!summer.accepted)return;
    expect(summer.claimKey).toBe('5-summer:true_path:fifth_summer_echo_convergence');
    const summerCommitted=commitFifthSeasonObjective(state,summer);
    expect(summerCommitted.committed).toBe(true);
    if(!summerCommitted.committed)return;
    state=summerCommitted.state;
    expect(state.campaignRun.phase).toBe('autumn');
    expect(state.campaignRun.seasonMilestones).toEqual(['path_convergence','summer_resolved']);
    expect(state.worldHistory.currentFacts).toEqual(['true_path_echoes_aligned']);
    expect(state.worldHistory.inheritedFacts).toEqual(['festival_saved']);

    const autumn=resolveFifthSeasonObjective({year:5,season:'autumn',source:'world_reweave',state});
    expect(autumn.accepted).toBe(true);
    if(!autumn.accepted)return;
    const autumnCommitted=commitFifthSeasonObjective(state,autumn);
    expect(autumnCommitted.committed).toBe(true);
    if(!autumnCommitted.committed)return;
    state=autumnCommitted.state;
    expect(state.campaignRun.phase).toBe('winter');
    expect(state.campaignRun.seasonMilestones).toEqual(['path_convergence','summer_resolved','autumn_resolved']);
    expect(state.worldHistory.currentFacts).toEqual(['true_path_echoes_aligned','true_path_world_rewoven']);

    const winter=resolveFifthSeasonObjective({year:5,season:'winter',source:'tactical_last_possibility',state});
    expect(winter.accepted).toBe(true);
    if(!winter.accepted)return;
    const winterCommitted=commitFifthSeasonObjective(state,winter);
    expect(winterCommitted.committed).toBe(true);
    if(!winterCommitted.committed)return;
    state=winterCommitted.state;
    expect(state.campaignRun.phase).toBe('winter');
    expect(state.campaignRun.seasonMilestones).not.toContain('winter_resolved');
    expect(state.campaignRun.claimedSeasonalObjectives).toEqual([
      '5-summer:true_path:fifth_summer_echo_convergence',
      '5-autumn:true_path:fifth_autumn_world_reweave',
      '5-winter:true_path:fifth_winter_last_possibility',
    ]);
  });

  it('blocks duplicate rewards and preserves Fifth claim keys through hydration',()=>{
    const initial=truePathState();
    const result=resolveFifthSeasonObjective({year:5,season:'summer',source:'echo_convergence',state:initial});
    expect(result.accepted).toBe(true);
    if(!result.accepted)return;
    const committed=commitFifthSeasonObjective(initial,result);
    expect(committed.committed).toBe(true);
    if(!committed.committed)return;
    const loaded=hydrateV3PersistentState(JSON.parse(JSON.stringify(committed.state)));
    expect(loaded.campaignRun.claimedSeasonalObjectives).toEqual(['5-summer:true_path:fifth_summer_echo_convergence']);
    const replay=resolveFifthSeasonObjective({year:5,season:'summer',source:'echo_convergence',state:{...loaded,campaignRun:{...loaded.campaignRun,phase:'summer'}}});
    expect(replay).toEqual(expect.objectContaining({accepted:false,reason:'already_claimed'}));
  });

  it('rejects wrong path, phase, source, malformed year and out-of-order season',()=>{
    const state=truePathState();
    expect(resolveFifthSeasonObjective({year:0,season:'summer',source:'echo_convergence',state}).accepted).toBe(false);
    expect(resolveFifthSeasonObjective({year:5,season:'summer',source:'wrong',state}).accepted).toBe(false);
    expect(resolveFifthSeasonObjective({year:5,season:'autumn',source:'world_reweave',state}).accepted).toBe(false);
    const normal={...state,campaignRun:{...state.campaignRun,activeCampaign:'caretaker' as const}};
    expect(resolveFifthSeasonObjective({year:5,season:'summer',source:'echo_convergence',state:normal}).accepted).toBe(false);
  });
});
