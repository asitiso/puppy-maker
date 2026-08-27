import type {CSSProperties} from 'react';
import type {ResolvedSceneInteraction,SceneAnchor} from './scene-types';

type Props={
  interaction:ResolvedSceneInteraction;
  anchor:SceneAnchor;
  onInteraction:(interaction:ResolvedSceneInteraction)=>void;
};

export default function InteractiveObject({interaction,anchor,onInteraction}:Props){
  const style={
    '--scene-x':`${anchor.x}%`,
    '--scene-y':`${anchor.y}%`,
  } as CSSProperties;
  const hinted=interaction.hint!=='none';
  return <button
    type="button"
    className={`v14-scene-object${hinted?' is-hinted':''}`}
    style={style}
    data-interaction-id={interaction.id}
    data-anchor-id={anchor.id}
    data-hint={interaction.hint}
    aria-label={interaction.label}
    disabled={!interaction.enabled}
    aria-disabled={!interaction.enabled}
    onClick={()=>onInteraction(interaction)}
  >
    <span>{interaction.label}</span>
  </button>;
}
