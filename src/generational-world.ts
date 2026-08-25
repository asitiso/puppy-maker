export const legacyWorldMarkerIds=[
  'festival_tradition',
  'open_road_network',
  'regional_compact',
  'restored_riftward',
  'forbidden_legacy',
  'hollow_scar',
] as const;

export const publicProjectIds=[
  'guardian_academy',
  'ancient_road_restoration',
  'regional_council',
  'rift_watch',
] as const;

export type LegacyWorldMarkerId=typeof legacyWorldMarkerIds[number];
export type PublicProjectId=typeof publicProjectIds[number];

export type GenerationalWorldState={
  legacyMarkers:LegacyWorldMarkerId[];
  activeProject:PublicProjectId|null;
  projectProgress:number;
  completedProjects:PublicProjectId[];
};

export type LegacyWorldDerivationInput={
  ancestors?:readonly unknown[];
  inheritedFacts?:readonly unknown[];
};

const isRecord=(value:unknown):value is Record<string,unknown>=>
  typeof value==='object'&&value!==null&&!Array.isArray(value);

function canonicalValues<T extends string>(raw:unknown,registry:readonly T[]):T[]{
  if(!Array.isArray(raw))return [];
  const selected=new Set(raw.filter((value):value is T=>
    typeof value==='string'&&(registry as readonly string[]).includes(value),
  ));
  return registry.filter(value=>selected.has(value));
}

function safeProgress(value:unknown):number{
  if(typeof value!=='number'||!Number.isFinite(value))return 0;
  return Math.min(100,Math.max(0,Math.floor(value)));
}

function isPublicProjectId(value:unknown):value is PublicProjectId{
  return typeof value==='string'&&(publicProjectIds as readonly string[]).includes(value);
}

export function emptyGenerationalWorldState():GenerationalWorldState{
  return {legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:[]};
}

export function hydrateGenerationalWorldState(raw:unknown):GenerationalWorldState{
  if(!isRecord(raw))return emptyGenerationalWorldState();
  const legacyMarkers=canonicalValues(raw.legacyMarkers,legacyWorldMarkerIds).slice(0,6);
  const completedProjects=canonicalValues(raw.completedProjects,publicProjectIds);
  const activeCandidate=isPublicProjectId(raw.activeProject)?raw.activeProject:null;
  const activeProject=activeCandidate&&!completedProjects.includes(activeCandidate)?activeCandidate:null;
  return {
    legacyMarkers,
    activeProject,
    projectProgress:activeProject?safeProgress(raw.projectProgress):0,
    completedProjects,
  };
}

export function deriveLegacyWorldMarkers(input:LegacyWorldDerivationInput):LegacyWorldMarkerId[]{
  const facts=new Set<string>();
  const addFacts=(raw:unknown)=>{
    if(!Array.isArray(raw))return;
    for(const value of raw){
      if(typeof value==='string')facts.add(value);
    }
  };

  addFacts(input.inheritedFacts);
  if(Array.isArray(input.ancestors)){
    for(const ancestor of input.ancestors){
      if(isRecord(ancestor))addFacts(ancestor.majorWorldFacts);
    }
  }

  const selected=new Set<LegacyWorldMarkerId>();
  if(facts.has('festival_saved'))selected.add('festival_tradition');
  if(facts.has('ancient_route_opened')||facts.has('ancient_route_limited'))selected.add('open_road_network');
  if(facts.has('regional_alliance')||facts.has('coalition_command'))selected.add('regional_compact');
  if(facts.has('rift_stabilized')||facts.has('true_path_world_rewoven'))selected.add('restored_riftward');
  if(facts.has('forbidden_relic_used')||facts.has('forbidden_relic_controlled'))selected.add('forbidden_legacy');
  if(facts.has('hollow_shortcut_taken')||facts.has('hollow_rift_entrenched'))selected.add('hollow_scar');
  return legacyWorldMarkerIds.filter(marker=>selected.has(marker)).slice(0,6);
}

export function startPublicProject(state:GenerationalWorldState,id:PublicProjectId):GenerationalWorldState{
  if(!isPublicProjectId(id)||state.activeProject||state.completedProjects.includes(id))return state;
  return {...state,activeProject:id,projectProgress:0};
}

export function contributeToPublicProject(state:GenerationalWorldState,amount:number):GenerationalWorldState{
  if(!state.activeProject||typeof amount!=='number'||!Number.isFinite(amount)||amount<=0)return state;
  const contribution=Math.max(0,Math.floor(amount));
  if(contribution===0)return state;
  const next=Math.min(100,state.projectProgress+contribution);
  if(next<100)return {...state,projectProgress:next};

  const completed=new Set<PublicProjectId>(state.completedProjects);
  completed.add(state.activeProject);
  return {
    ...state,
    activeProject:null,
    projectProgress:0,
    completedProjects:publicProjectIds.filter(project=>completed.has(project)),
  };
}
