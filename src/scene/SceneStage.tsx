import CharacterActor from './CharacterActor';
import InteractiveObject from './InteractiveObject';
import type {ResolvedScene,ResolvedSceneInteraction,SceneAnchor} from './scene-types';
import './scene.css';

type Props={
  scene:ResolvedScene;
  onInteraction:(interaction:ResolvedSceneInteraction)=>void;
};

export default function SceneStage({scene,onInteraction}:Props){
  const anchors=new Map<string,SceneAnchor>(scene.anchors.map(anchor=>[anchor.id,anchor]));
  return <section
    className="v14-scene-stage"
    data-location={scene.location}
    data-season={scene.season}
    data-weather={scene.weather}
    aria-label={`${scene.location} 장면`}
  >
    <div className="v14-scene-layers" aria-hidden="true">
      {scene.backgroundLayers.map(layer=><i
        key={layer.id}
        className={`v14-scene-layer v14-scene-layer--${layer.kind}`}
        data-layer-token={layer.token}
        style={{zIndex:layer.zIndex}}
      />)}
    </div>
    <div className="v14-scene-cast">
      {scene.cast.map(actor=>{
        const anchor=anchors.get(actor.anchorId);
        return anchor?<CharacterActor key={`${actor.actorId}:${actor.anchorId}`} actor={actor} anchor={anchor}/>:null;
      })}
    </div>
    <div className="v14-scene-interactions">
      {scene.interactions.map(interaction=>{
        const anchor=anchors.get(interaction.anchorId);
        return anchor?<InteractiveObject key={interaction.id} interaction={interaction} anchor={anchor} onInteraction={onInteraction}/>:null;
      })}
    </div>
  </section>;
}
