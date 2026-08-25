import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {
  emptyGenerationalWorldState,
  startPublicProject,
  type GenerationalWorldState,
} from './generational-world';
import {weeklyEventFor} from './weekly-life';
import {weeklyNpcPresence} from './living-npcs';

type V6GameState=GameState&{generationalWorld:GenerationalWorldState};
const worldOf=(state:GameState)=>(state as V6GameState).generationalWorld;

function ngPlusEligible(world:GenerationalWorldState):V6GameState{
  const ending='v3:caretaker:bond:world:career';
  return {
    ...initialState,
    generationalWorld:world,
    year:3,
    resolvedEnding:ending,
    worldHistory:{currentFacts:['festival_saved'],inheritedFacts:['regional_alliance']},
    campaignRun:{
      ...initialState.campaignRun,
      runNumber:2,
      phase:'ending',
      activeCampaign:'caretaker',
      activeRoute:'normal',
      seasonMilestones:['winter_resolved','ending_committed'],
      majorOutcomes:{long_night:'victory'},
    },
    legacy:{
      ...initialState.legacy,
      completedRuns:1,
      completedCampaigns:['caretaker'],
      endingCollection:[ending],
      careerCollection:['career'],
      runSummaries:[{
        runNumber:2,
        campaign:'caretaker',
        route:'normal',
        ending,
        career:'career',
        majorWorldOutcomes:['festival_saved'],
        keyBondMemories:[],
        trueClues:[],
      }],
    },
  } as unknown as V6GameState;
}

describe('V6 Living World core integration',()=>{
  it('hydrates V6 state, starts a project, and contributes exactly once on a completed world-focus week',()=>{
    const hydrated=hydrateGameState({
      generationalWorld:{activeProject:'guardian_academy',projectProgress:30},
    });
    expect(worldOf(hydrated)).toEqual({
      legacyMarkers:[],activeProject:'guardian_academy',projectProgress:30,completedProjects:[],
    });

    const started=reducer(initialState,{type:'START_PUBLIC_PROJECT',projectId:'guardian_academy'} as never);
    expect(worldOf(started).activeProject).toBe('guardian_academy');

    let state=reducer(started,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
    state=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(worldOf(state).projectProgress).toBe(10);
    const duplicate=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(worldOf(duplicate).projectProgress).toBe(10);
  });

  it('derives next-generation world legacy, preserves completed civic history, and clears unfinished work with raw power',()=>{
    const world={
      legacyMarkers:[],
      activeProject:'rift_watch' as const,
      projectProgress:70,
      completedProjects:['guardian_academy' as const],
    };
    const mature={
      ...initialState,
      year:3,
      resolvedEnding:'v3:caretaker:bond:world:career',
      gold:99999,
      gems:999,
      stats:{...initialState.stats,strength:99,magic:97},
      personality:{courage:20,kindness:90,curiosity:30,calmness:40},
      worldHistory:{currentFacts:['festival_saved','regional_alliance'] as const,inheritedFacts:[]},
      generationalWorld:world,
    } as unknown as V6GameState;

    const next=reducer(mature,{type:'START_NEXT_GENERATION'});
    expect(next.lineage.generation).toBe(2);
    expect(worldOf(next)).toEqual({
      legacyMarkers:['festival_tradition','regional_compact'],
      activeProject:null,
      projectProgress:0,
      completedProjects:['guardian_academy'],
    });
    expect(next.gold).toBe(initialState.gold);
    expect(next.gems).toBe(initialState.gems);
    expect(next.stats).toEqual(initialState.stats);
  });

  it('keeps the long-world record through NG+ without auto-activating True or Hollow',()=>{
    const world={
      legacyMarkers:['hollow_scar' as const,'regional_compact' as const],
      activeProject:null,
      projectProgress:0,
      completedProjects:['regional_council' as const],
    };
    const completed=ngPlusEligible(world);
    const next=reducer(completed,{type:'NEW_RUN'});
    expect(next.campaignRun.runNumber).toBe(3);
    expect(worldOf(next)).toEqual(world);
    expect(next.campaignRun.activeRoute).not.toBe('hollow');
    expect(next.campaignRun.activeCampaign).not.toBe('true_path');
  });

  it('makes world-focus events react to legacy while preserving active special-route priority',()=>{
    const base={
      year:1,month:1,week:1,focus:'world',activeCampaign:'caretaker',activeRoute:'normal',runNumber:1,inheritedFactCount:0,
      heritageTraits:[],generation:2,legacyMarkers:[],completedProjects:[],
    } as any;
    expect(weeklyEventFor({...base,legacyMarkers:['open_road_network']})).toBe('legacy_road_patrol');
    expect(weeklyEventFor({...base,legacyMarkers:['hollow_scar']})).toBe('scarred_district');
    expect(weeklyEventFor({...base,completedProjects:['rift_watch']})).toBe('rift_watch_rounds');
    expect(weeklyEventFor({...base,completedProjects:['guardian_academy']})).toBe('academy_drill');
    expect(weeklyEventFor({...base,activeRoute:'hollow',legacyMarkers:['open_road_network']})).toBe('rift_whisper');
    expect(weeklyEventFor({...base,activeCampaign:'true_path',legacyMarkers:['hollow_scar']})).toBe('old_echo');
  });

  it('changes later-generation NPC presence from civic legacy without inventing Hollow activation',()=>{
    const base={
      activeCampaign:'caretaker',activeRoute:'normal',week:3,month:1,runNumber:1,inheritedFactCount:0,
      generation:3,legacyMarkers:[],completedProjects:[],
    } as any;
    expect(weeklyNpcPresence({...base,completedProjects:['guardian_academy']})).toContain('eiden');
    const scarred=weeklyNpcPresence({...base,legacyMarkers:['hollow_scar']});
    expect(scarred).toContain('lyra');
    expect(scarred).not.toContain('veyr');
    expect(scarred).toHaveLength(3);
  });
});
