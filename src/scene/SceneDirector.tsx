import {useCallback,useEffect,useState,type ReactNode} from 'react';
import type {ResolvedScene,ResolvedSceneInteraction} from './scene-types';
import {advanceSceneRuntime,beginSceneInteraction,claimSceneCommit,createSceneRuntime,type SceneRuntimeState} from './scene-runtime';

export type SceneDirectorController={
  runtime:SceneRuntimeState;
  start:(interactionId:string)=>void;
  advance:()=>void;
};

type Props={
  scene:ResolvedScene;
  onCommit:(interaction:ResolvedSceneInteraction)=>void;
  children?:(controller:SceneDirectorController)=>ReactNode;
};

export default function SceneDirector({scene,onCommit,children}:Props){
  const [runtime,setRuntime]=useState<SceneRuntimeState>(()=>createSceneRuntime());

  useEffect(()=>{ setRuntime(createSceneRuntime()); },[scene.id]);

  useEffect(()=>{
    if(runtime.phase!=='committing'||runtime.commitClaimed) return;
    const claimed=claimSceneCommit(runtime);
    if(!claimed.commit) return;
    const interaction=scene.interactions.find(item=>item.id===claimed.commit?.interactionId);
    if(interaction?.enabled) onCommit(interaction);
    setRuntime(claimed.state);
  },[runtime,scene.interactions,onCommit]);

  const start=useCallback((interactionId:string)=>{
    const interaction=scene.interactions.find(item=>item.id===interactionId);
    if(!interaction?.enabled) return;
    setRuntime(current=>beginSceneInteraction(current,interactionId));
  },[scene.interactions]);

  const advance=useCallback(()=>setRuntime(current=>advanceSceneRuntime(current)),[]);
  return <div className="v14-scene-director" data-scene-id={scene.id} data-scene-phase={runtime.phase}>
    {children?.({runtime,start,advance})}
  </div>;
}
