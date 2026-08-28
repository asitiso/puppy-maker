import {type CSSProperties,useEffect} from 'react';
import CharacterActor from './CharacterActor';
import InteractiveObject from './InteractiveObject';
import SceneDirector,{type SceneDirectorController} from './SceneDirector';
import {resolveSceneFeedbackVisual} from './scene-asset-registry';
import type {SceneRuntimePhase} from './scene-runtime';
import type {ResolvedScene,ResolvedSceneInteraction,SceneAnchor} from './scene-types';
import './scene.css';

type Props={
  scene:ResolvedScene;
  onInteraction:(interaction:ResolvedSceneInteraction)=>void;
};

type SceneStageFrameProps=Props&{
  runtimeActorAnchorId?:string;
  runtimeActorPose?:string;
  runtimeActorMotion?:string;
  runtimePhase?:SceneRuntimePhase;
};

function poseForInteraction(interaction:ResolvedSceneInteraction|undefined,phase:SceneRuntimePhase):string|undefined{
  if(phase==='idle'||phase==='approaching') return undefined;
  if(phase==='presenting') return 'happy';
  switch(interaction?.mode){
    case 'dialogue': return 'talk';
    case 'rest': return 'sit';
    case 'training':
    case 'minigame': return 'training-ready';
    case 'inspect':
    case 'collect':
    case 'explore':
    case 'choice': return 'surprised';
    default: return 'idle';
  }
}

function motionForPhase(phase:SceneRuntimePhase):string|undefined{
  if(phase==='approaching') return 'approach';
  if(phase==='acting') return 'turn';
  if(phase==='presenting') return 'bob';
  return undefined;
}

function SceneStageFrame({
  scene,onInteraction,runtimeActorAnchorId,runtimeActorPose,runtimeActorMotion,runtimePhase='idle',
}:SceneStageFrameProps){
  const anchors=new Map<string,SceneAnchor>(scene.anchors.map(anchor=>[anchor.id,anchor]));
  const resolvedRunaAnchor=scene.cast.find(actor=>actor.actorId==='runa')?.anchorId;
  const feedbackVisual=resolveSceneFeedbackVisual(runtimePhase);
  const feedbackAnchor=runtimeActorAnchorId?anchors.get(runtimeActorAnchorId):undefined;
  return <section
    className="v14-scene-stage"
    data-location={scene.location}
    data-season={scene.season}
    data-weather={scene.weather}
    data-runtime-phase={runtimePhase}
    aria-label={`${scene.location} 장면`}
  >
    <div className="v14-scene-layers" aria-hidden="true">
      {scene.backgroundLayers.map(layer=>{
        const style={
          zIndex:layer.zIndex,
          '--scene-background-image':layer.src?`url("${layer.src}")`:undefined,
        } as CSSProperties;
        return <i
          key={layer.id}
          className={`v14-scene-layer v14-scene-layer--${layer.kind}`}
          data-layer-token={layer.token}
          data-layer-src={layer.src}
          style={style}
        />;
      })}
    </div>
    <div className="v14-scene-cast">
      {scene.cast.map(actor=>{
        const directed=actor.actorId==='runa'&&runtimeActorAnchorId
          ?{...actor,anchorId:runtimeActorAnchorId,pose:runtimeActorPose??actor.pose,motion:runtimeActorMotion??actor.motion}
          :actor;
        const anchor=anchors.get(directed.anchorId);
        return anchor?<CharacterActor key={actor.actorId} actor={directed} anchor={anchor} runtimePhase={runtimePhase}/>:null;
      })}
    </div>
    {feedbackVisual&&feedbackAnchor?<img
      className={`v14-scene-feedback is-${feedbackVisual.kind}`}
      src={feedbackVisual.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-feedback-kind={feedbackVisual.kind}
      data-feedback-src={feedbackVisual.src}
      style={{
        '--scene-x':`${feedbackAnchor.x}%`,
        '--scene-y':`${feedbackAnchor.y}%`,
      } as CSSProperties}
    />:null}
    <div className="v14-scene-interactions">
      {scene.interactions.map(interaction=>{
        const anchorId=interaction.id==='runa'?(runtimeActorAnchorId??resolvedRunaAnchor??interaction.anchorId):interaction.anchorId;
        const anchor=anchors.get(anchorId);
        return anchor?<InteractiveObject key={interaction.id} interaction={interaction} anchor={anchor} onInteraction={onInteraction}/>:null;
      })}
    </div>
  </section>;
}

function DirectedSceneStage({scene,controller}:{scene:ResolvedScene;controller:SceneDirectorController}){
  const interaction=scene.interactions.find(item=>item.id===controller.runtime.activeInteractionId);
  const phase=controller.runtime.phase;
  const runtimeActorAnchorId=phase==='idle'?undefined:interaction?.anchorId;
  const runtimeActorPose=poseForInteraction(interaction,phase);
  const runtimeActorMotion=motionForPhase(phase);

  useEffect(()=>{
    if(phase==='idle') return;
    if(phase==='committing'&&!controller.runtime.commitClaimed) return;
    const delay=phase==='approaching'?220:phase==='acting'?180:phase==='committing'?40:220;
    const timer=globalThis.setTimeout(controller.advance,delay);
    return ()=>globalThis.clearTimeout(timer);
  },[controller.advance,controller.runtime.commitClaimed,phase]);

  return <SceneStageFrame
    scene={scene}
    onInteraction={interaction=>controller.start(interaction.id)}
    runtimeActorAnchorId={runtimeActorAnchorId}
    runtimeActorPose={runtimeActorPose}
    runtimeActorMotion={runtimeActorMotion}
    runtimePhase={phase}
  />;
}

export default function SceneStage({scene,onInteraction}:Props){
  return <SceneDirector scene={scene} onCommit={onInteraction}>
    {controller=><DirectedSceneStage scene={scene} controller={controller}/>} 
  </SceneDirector>;
}
