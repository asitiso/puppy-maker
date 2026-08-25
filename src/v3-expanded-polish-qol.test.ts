import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,type GameState} from './game';
import {getRunGuidance} from './run-guidance';

function roundTrip(state:GameState):GameState{
  return hydrateGameState(JSON.parse(JSON.stringify(state)));
}

describe('Expanded Polish repeat-play QoL',()=>{
  it('preserves True Path guidance across save/re-entry without exposing hidden authority',()=>{
    const state=structuredClone(initialState);
    state.campaignRun.activeCampaign='true_path';
    state.campaignRun.phase='autumn';
    state.campaignRun.campaignAffinities.caretaker=77;
    const before=getRunGuidance(state);
    const after=getRunGuidance(roundTrip(state));
    expect(after).toEqual(before);
    expect(JSON.stringify(after)).not.toContain('77');
    expect(after).toMatchObject({mode:'active_run',routeTone:'true',seasonLabel:'가을'});
  });

  it('preserves accepted Hollow route identity across reload without replaying candidate semantics',()=>{
    const state=structuredClone(initialState);
    state.campaignRun.activeCampaign='true_path';
    state.campaignRun.activeRoute='hollow';
    state.campaignRun.phase='winter';
    state.campaignRun.dangerState={
      score:3,
      behaviors:['accepted_veyr_power'],
      evidence:['veyr_power'],
      finalChoiceResolution:'accepted',
    };
    const reloaded=roundTrip(state);
    const guidance=getRunGuidance(reloaded);
    expect(reloaded.campaignRun.dangerState.finalChoiceResolution).toBe('accepted');
    expect(guidance).toMatchObject({mode:'active_run',routeTone:'hollow',seasonLabel:'겨울'});
    expect(JSON.stringify(guidance)).not.toMatch(/candidate|hollow_candidate|dangerState|score/i);
  });

  it('keeps completed-run guidance stable through reload so the next action is clear',()=>{
    const state=structuredClone(initialState);
    state.campaignRun.activeCampaign='caretaker';
    state.campaignRun.phase='ending';
    state.legacy.completedRuns=1;
    state.legacy.runSummaries=[{
      runNumber:1,
      campaign:'caretaker',
      route:'normal',
      ending:'v3:caretaker:bond_kept:world_saved:guardian',
      career:'guardian',
      majorWorldOutcomes:['festival_saved'],
      keyBondMemories:[],
      trueClues:[],
    }];
    const guidance=getRunGuidance(roundTrip(state));
    expect(guidance.mode).toBe('ready_for_new_run');
    expect(guidance.nextAction).toContain('새로운 가능성');
    expect(guidance.recentResult).toContain('Caretaker');
  });
});
