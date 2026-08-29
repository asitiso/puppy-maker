import type {CSSProperties} from 'react';
import {resolveSceneInteractionPresentation} from './scene-interaction-presentation';
import type {ResolvedSceneInteraction,SceneAnchor} from './scene-types';

type Props={
  interaction:ResolvedSceneInteraction;
  anchor:SceneAnchor;
  onInteraction:(interaction:ResolvedSceneInteraction)=>void;
};

function edgeForAnchor(anchor:SceneAnchor):'left'|'center'|'right'{
  if(anchor.x<=18)return 'left';
  if(anchor.x>=82)return 'right';
  return 'center';
}

export default function InteractiveObject({interaction,anchor,onInteraction}:Props){
  const style={
    '--scene-x':`${anchor.x}%`,
    '--scene-y':`${anchor.y}%`,
  } as CSSProperties;
  const presentation=resolveSceneInteractionPresentation(interaction);
  const hinted=interaction.hint!=='none';
  return <button
    type="button"
    className={`v14-scene-object${hinted?' is-hinted':''}`}
    style={style}
    data-interaction-id={interaction.id}
    data-anchor-id={anchor.id}
    data-mode={interaction.mode}
    data-hint={interaction.hint}
    data-family={presentation.family}
    data-emphasis={presentation.emphasis}
    data-edge={edgeForAnchor(anchor)}
    aria-label={interaction.label}
    disabled={!interaction.enabled}
    aria-disabled={!interaction.enabled}
    onClick={()=>onInteraction(interaction)}
  >
    <i className="v14-scene-object__marker" data-icon-token={presentation.iconToken} aria-hidden="true"/>
    <span className="v14-scene-object__label">{interaction.label}</span>
    {presentation.hintLabel?<small className="v14-scene-object__badge" aria-hidden="true">{presentation.hintLabel}</small>:null}
  </button>;
}
