import {useMemo,useRef,useState} from 'react';
import type {OutingLocationId} from '../adventure';
import SceneStage from './SceneStage';
import {outingScene,outingTargets} from './outing-scenes';
import type {SceneActorState} from './scene-types';

const locationLabels:Record<OutingLocationId,string>={forest:'별빛 숲',village:'마법 마을',lakeside:'바람 호숫가'};

type Props={
  location:OutingLocationId;
  year:number;
  month:number;
  week:number;
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
  onOuting:(location:OutingLocationId)=>void;
  onExit?:()=>void;
};

export default function OutingSceneFlow({location,year,month,week,actorState,campaignId,worldFacts,inheritedWorldFacts,onOuting,onExit}:Props){
  const committedRef=useRef(false);
  const [hint,setHint]=useState('관심 가는 장소를 눌러 루나와 함께 조사해 보세요.');
  const scene=useMemo(()=>outingScene(location,{year,month,week,actorState,campaignId,worldFacts,inheritedWorldFacts}),[location,year,month,week,actorState,campaignId,worldFacts,inheritedWorldFacts]);
  const targets=useMemo(()=>outingTargets(location),[location]);
  const targetById=useMemo(()=>new Map(targets.map(target=>[target.interactionId,target])),[targets]);

  return <section className="v14-outing-scene-flow" data-location={location} aria-label={`${locationLabels[location]} 탐험 장면`}>
    <SceneStage scene={scene} onInteraction={interaction=>{
      if(interaction.id==='exit'){
        onExit?.();
        return;
      }
      const target=targetById.get(interaction.id);
      if(!target){setHint('주변을 살펴봤어요. 탐험 표식이 있는 장소를 선택해 보세요.');return;}
      setHint(target.presentationHint);
      if(committedRef.current)return;
      committedRef.current=true;
      onOuting(location);
    }}/>
    <div className="v14-outing-scene-flow__guide" aria-live="polite">
      <small>OUTING SCENE · {scene.season.toUpperCase()} · {scene.weather.toUpperCase()}</small>
      <strong>{locationLabels[location]}</strong>
      <span>{hint}</span>
    </div>
  </section>;
}
