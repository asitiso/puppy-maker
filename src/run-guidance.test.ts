import {describe,expect,it} from 'vitest';
import {initialState,type GameState} from './game';
import {getRunGuidance} from './run-guidance';

function state():GameState{
  return structuredClone(initialState);
}

describe('getRunGuidance',()=>{
  it('guides a brand new Spring run without leaking hidden authority',()=>{
    const view=getRunGuidance(state());
    expect(view).toMatchObject({
      mode:'first_run',
      campaignLabel:'아직 선택 전',
      seasonLabel:'봄',
      routeTone:'normal',
    });
    expect(view.nextAction.length).toBeGreaterThan(0);
  });

  it('summarizes an active normal campaign semantically',()=>{
    const current=state();
    current.campaignRun.activeCampaign='caretaker';
    current.campaignRun.phase='summer';
    const view=getRunGuidance(current);
    expect(view).toMatchObject({
      mode:'active_run',
      campaignLabel:'Caretaker',
      seasonLabel:'여름',
      routeTone:'normal',
    });
    expect(view.title).toContain('Caretaker');
  });

  it('distinguishes True and Hollow presentation identity without changing authority',()=>{
    const trueRun=state();
    trueRun.campaignRun.activeCampaign='true_path';
    trueRun.campaignRun.phase='autumn';
    expect(getRunGuidance(trueRun)).toMatchObject({
      campaignLabel:'True Path',
      seasonLabel:'가을',
      routeTone:'true',
    });

    const hollowRun=state();
    hollowRun.campaignRun.activeCampaign='true_path';
    hollowRun.campaignRun.activeRoute='hollow';
    hollowRun.campaignRun.phase='winter';
    expect(getRunGuidance(hollowRun)).toMatchObject({
      campaignLabel:'True Path',
      seasonLabel:'겨울',
      routeTone:'hollow',
    });
  });

  it('acknowledges a returning player and surfaces only a semantic recent result',()=>{
    const current=state();
    current.legacy.completedRuns=1;
    current.legacy.runSummaries=[{
      runNumber:1,
      campaign:'pathfinder',
      route:'normal',
      ending:'beyond_the_map',
      career:'trailblazer',
      majorWorldOutcomes:[],
      keyBondMemories:[],
      trueClues:[],
    }];
    const view=getRunGuidance(current);
    expect(view.mode).toBe('returning_run');
    expect(view.recentResult).toContain('Pathfinder');
    expect(view.body).toContain('새로운 가능성');
  });

  it('makes the next run obvious after the current run reaches ending',()=>{
    const current=state();
    current.campaignRun.activeCampaign='arcanist';
    current.campaignRun.phase='ending';
    current.legacy.completedRuns=1;
    current.legacy.runSummaries=[{
      runNumber:1,
      campaign:'arcanist',
      route:'normal',
      ending:'rift_resolved',
      career:'rift_scholar',
      majorWorldOutcomes:[],
      keyBondMemories:[],
      trueClues:[],
    }];
    const view=getRunGuidance(current);
    expect(view).toMatchObject({mode:'ready_for_new_run',campaignLabel:'Arcanist'});
    expect(view.nextAction).toContain('새로운 가능성');
  });

  it('never exposes raw affinity, danger score, thresholds, or internal Hollow tier names',()=>{
    const current=state();
    current.campaignRun.campaignAffinities.caretaker=9999;
    current.campaignRun.dangerState.score=9999;
    current.campaignRun.dangerState.evidence=['veyr_power'];
    const serialized=JSON.stringify(getRunGuidance(current));
    expect(serialized).not.toMatch(/affinity|dangerState|score|threshold|legacy power|hollow_candidate/i);
    expect(serialized).not.toContain('9999');
  });
});
