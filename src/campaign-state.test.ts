import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState,hydrateCampaignRunState} from './campaign-state';

describe('V3 campaign run hydration',()=>{
  it('starts as an inert first-run Spring state',()=>{
    expect(emptyCampaignRunState()).toMatchObject({
      runNumber:1,phase:'spring_exploration',activeCampaign:null,activeRoute:'normal',
      campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
      dangerState:{score:0,behaviors:[]},
    });
  });

  it('canonicalizes malformed campaign state',()=>{
    const state=hydrateCampaignRunState({
      runNumber:-4,phase:'spring_99',activeCampaign:'stale_path',activeRoute:'forced',
      campaignAffinities:{caretaker:12.8,pathfinder:Infinity,vanguard:-2,arcanist:NaN},
      dangerState:{score:Infinity,behaviors:['used_forbidden_relic','used_forbidden_relic','stale']},
      seasonMilestones:['path_convergence','path_convergence','stale'],
      majorChoices:{pathfinder_autumn:'centralize'},
      majorOutcomes:{guardian_festival:'defeat',unknown_event:'victory'},
      failForwardOutcomes:['guardian_festival','guardian_festival','unknown_event'],
    });
    expect(state.runNumber).toBe(1);
    expect(state.phase).toBe('spring_exploration');
    expect(state.activeCampaign).toBeNull();
    expect(state.activeRoute).toBe('normal');
    expect(state.campaignAffinities).toEqual({caretaker:12,pathfinder:0,vanguard:0,arcanist:0});
    expect(state.dangerState).toEqual({score:0,behaviors:['used_forbidden_relic']});
    expect(state.seasonMilestones).toEqual(['path_convergence']);
    expect(state.majorChoices).toEqual({});
    expect(state.majorOutcomes).toEqual({guardian_festival:'defeat'});
    expect(state.failForwardOutcomes).toEqual(['guardian_festival']);
  });
});
