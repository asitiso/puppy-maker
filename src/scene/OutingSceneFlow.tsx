import type {OutingLocationId} from '../adventure';
import MobileExplorationScene from '../exploration/MobileExplorationScene';
import {forestStoryFrames,forestWorld} from '../exploration/forest-world';
import {lakesideStoryFrames,lakesideWorld} from '../exploration/lakeside-world';
import {villageStoryFrames,villageWorld} from '../exploration/village-world';
import type {ExplorationStoryFrame,ExplorationWorldDefinition} from '../exploration/exploration-types';
import type {SceneActorState} from './scene-types';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';

const explorationByLocation:Record<OutingLocationId,{
  world:ExplorationWorldDefinition;
  storyFrames:Record<string,ExplorationStoryFrame>;
}>={
  forest:{world:forestWorld,storyFrames:forestStoryFrames},
  village:{world:villageWorld,storyFrames:villageStoryFrames},
  lakeside:{world:lakesideWorld,storyFrames:lakesideStoryFrames},
};

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

export default function OutingSceneFlow(props:Props){
  const exploration=explorationByLocation[props.location];
  return <MobileExplorationScene
    world={exploration.world}
    storyFrames={exploration.storyFrames}
    playerArtSrc={runaExplorationArt}
    onProgress={()=>props.onOuting(props.location)}
    onExit={props.onExit??(()=>{})}
  />;
}
