export type SceneRuntimePhase='idle'|'approaching'|'acting'|'committing'|'presenting';
export type SceneBehavior='story'|'player'|'activity'|'state'|'autonomous'|'idle';

export interface SceneRuntimeState{
  phase:SceneRuntimePhase;
  activeInteractionId:string|null;
  commitClaimed:boolean;
}

export interface SceneBehaviorSources{
  story?:boolean;
  player?:boolean;
  activity?:boolean;
  stateReaction?:boolean;
  autonomous?:boolean;
}

export function createSceneRuntime():SceneRuntimeState{
  return {phase:'idle',activeInteractionId:null,commitClaimed:false};
}

export function beginSceneInteraction(state:SceneRuntimeState,interactionId:string):SceneRuntimeState{
  if(state.phase!=='idle'||!interactionId) return state;
  return {phase:'approaching',activeInteractionId:interactionId,commitClaimed:false};
}

export function advanceSceneRuntime(state:SceneRuntimeState):SceneRuntimeState{
  switch(state.phase){
    case 'idle': return state;
    case 'approaching': return {...state,phase:'acting'};
    case 'acting': return {...state,phase:'committing'};
    case 'committing': return state.commitClaimed?{...state,phase:'presenting'}:state;
    case 'presenting': return createSceneRuntime();
  }
}

export function claimSceneCommit(state:SceneRuntimeState):{
  state:SceneRuntimeState;
  commit:{interactionId:string}|null;
}{
  if(state.phase!=='committing'||state.commitClaimed||!state.activeInteractionId){
    return {state,commit:null};
  }
  return {
    state:{...state,commitClaimed:true},
    commit:{interactionId:state.activeInteractionId},
  };
}

export function selectSceneBehavior(sources:SceneBehaviorSources):SceneBehavior{
  if(sources.story) return 'story';
  if(sources.player) return 'player';
  if(sources.activity) return 'activity';
  if(sources.stateReaction) return 'state';
  if(sources.autonomous) return 'autonomous';
  return 'idle';
}
