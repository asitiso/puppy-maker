import type {CSSProperties} from 'react';
import {resolveActorVisual} from './scene-asset-registry';
import type {ResolvedSceneActor,SceneAnchor,SceneActorId} from './scene-types';

const ACTOR_LABELS:Partial<Record<SceneActorId,string>>={
  runa:'루나',bear:'곰',owl:'올빼미',wolf:'늑대',cat:'고양이',
};

type Props={
  actor:ResolvedSceneActor;
  anchor:SceneAnchor;
};

export default function CharacterActor({actor,anchor}:Props){
  const visual=resolveActorVisual(actor.actorId,actor.pose);
  const style={
    '--scene-x':`${anchor.x}%`,
    '--scene-y':`${anchor.y}%`,
  } as CSSProperties;
  const label=ACTOR_LABELS[actor.actorId]??(actor.actorId.startsWith('npc:')?actor.actorId.slice(4):actor.actorId);
  return <figure
    className="v14-scene-actor"
    style={style}
    data-actor-id={actor.actorId}
    data-anchor-id={anchor.id}
    data-pose={visual.resolvedPose}
    data-motion={actor.motion}
    aria-label={label}
  >
    {visual.src?<img src={visual.src} alt={label} draggable={false}/>:<span aria-hidden="true">{label}</span>}
  </figure>;
}
