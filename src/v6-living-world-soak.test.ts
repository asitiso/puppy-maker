import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {legacyWorldMarkerIds,publicProjectIds,type PublicProjectId} from './generational-world';

function finiteTree(value:unknown,path='state'){
  if(typeof value==='number'){
    expect(Number.isFinite(value),`${path} must remain finite`).toBe(true);
    return;
  }
  if(Array.isArray(value)){
    value.forEach((item,index)=>finiteTree(item,`${path}[${index}]`));
    return;
  }
  if(value&&typeof value==='object'){
    for(const [key,item] of Object.entries(value))finiteTree(item,`${path}.${key}`);
  }
}

function playWorldWeek(state:GameState):GameState{
  let next=reducer(state,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
  next=reducer(next,{type:'COMPLETE_WEEKLY_FOCUS'});
  const duplicate=reducer(next,{type:'COMPLETE_WEEKLY_FOCUS'});
  expect(duplicate).toBe(next);
  return reducer(next,{type:'ADVANCE_WEEK'});
}

function finishProject(state:GameState,projectId:PublicProjectId):GameState{
  let next=reducer(state,{type:'START_PUBLIC_PROJECT',projectId});
  expect(next.generationalWorld.activeProject).toBe(projectId);
  for(let week=0;week<10;week+=1){
    const before=next.generationalWorld.projectProgress;
    next=playWorldWeek(next);
    if(week<9)expect(next.generationalWorld.projectProgress).toBe(before+10);
  }
  expect(next.generationalWorld.activeProject).toBeNull();
  expect(next.generationalWorld.projectProgress).toBe(0);
  expect(next.generationalWorld.completedProjects).toContain(projectId);
  return next;
}

const generationFacts=[
  'festival_saved',
  'ancient_route_opened',
  'regional_alliance',
  'rift_stabilized',
  'hollow_rift_entrenched',
] as const;

function mature(state:GameState,generation:number):GameState{
  const hollow=generation===5;
  return {
    ...state,
    year:3,
    resolvedEnding:hollow?'v3:hollow:bond:world:career':'v3:caretaker:bond:world:career',
    gold:70000+generation,
    gems:700+generation,
    stats:{...state.stats,strength:90+generation,magic:80+generation,stress:55,fatigue:44},
    worldHistory:{
      inheritedFacts:state.worldHistory.inheritedFacts,
      currentFacts:[generationFacts[generation-1]],
    },
    campaignRun:{
      ...state.campaignRun,
      activeCampaign:hollow?'arcanist':'caretaker',
      activeRoute:hollow?'hollow':'normal',
    },
  } as GameState;
}

describe('V6 Living World five-generation soak',()=>{
  it('builds civic history across five transitions with reload, malformed recovery and no raw-power inheritance',()=>{
    let state:GameState=initialState;

    for(let generation=1;generation<=5;generation+=1){
      expect(state.lineage.generation).toBe(generation);
      expect(state.campaignRun.activeRoute).not.toBe('hollow');
      expect(state.campaignRun.activeCampaign).not.toBe('true_path');

      if(generation<=publicProjectIds.length){
        state=finishProject(state,publicProjectIds[generation-1]);
        expect(state.generationalWorld.completedProjects).toHaveLength(generation);
      }

      state=hydrateGameState(JSON.parse(JSON.stringify(state)));
      finiteTree(state);
      expect(state.generationalWorld.legacyMarkers.length).toBeLessThanOrEqual(6);
      expect(new Set(state.generationalWorld.completedProjects).size).toBe(state.generationalWorld.completedProjects.length);

      if(generation===2){
        state=hydrateGameState({
          ...state,
          generationalWorld:{
            legacyMarkers:['bad',...state.generationalWorld.legacyMarkers,...state.generationalWorld.legacyMarkers],
            activeProject:'guardian_academy',
            projectProgress:Number.POSITIVE_INFINITY,
            completedProjects:[...state.generationalWorld.completedProjects,'bad','guardian_academy',...state.generationalWorld.completedProjects],
          },
        });
        expect(state.generationalWorld.completedProjects).toEqual(['guardian_academy','ancient_road_restoration']);
        expect(state.generationalWorld.activeProject).toBeNull();
        expect(state.generationalWorld.projectProgress).toBe(0);
        expect(state.generationalWorld.legacyMarkers.every(marker=>legacyWorldMarkerIds.includes(marker))).toBe(true);
        finiteTree(state);
      }

      const beforeTransition=mature(state,generation);
      const next=reducer(beforeTransition,{type:'START_NEXT_GENERATION'});
      expect(next).not.toBe(beforeTransition);
      expect(next.lineage.generation).toBe(generation+1);
      expect(next.gold).toBe(initialState.gold);
      expect(next.gems).toBe(initialState.gems);
      expect(next.stats).toEqual(initialState.stats);
      expect(next.generationalWorld.activeProject).toBeNull();
      expect(next.generationalWorld.projectProgress).toBe(0);
      expect(next.generationalWorld.completedProjects).toEqual(state.generationalWorld.completedProjects);
      expect(next.generationalWorld.legacyMarkers.length).toBeLessThanOrEqual(6);
      expect(next.campaignRun.activeRoute).not.toBe('hollow');
      expect(next.campaignRun.activeCampaign).not.toBe('true_path');
      state=hydrateGameState(JSON.parse(JSON.stringify(next)));
    }

    expect(state.lineage.generation).toBe(6);
    expect(state.lineage.ancestors).toHaveLength(5);
    expect(state.generationalWorld.completedProjects).toEqual([...publicProjectIds]);
    expect(state.generationalWorld.legacyMarkers).toEqual([
      'festival_tradition','open_road_network','regional_compact','restored_riftward','hollow_scar',
    ]);
    expect(state.campaignRun.activeRoute).not.toBe('hollow');
    expect(state.campaignRun.activeCampaign).not.toBe('true_path');
    expect(new Set(state.generationalWorld.completedProjects).size).toBe(state.generationalWorld.completedProjects.length);
    finiteTree(state);
  });
});
