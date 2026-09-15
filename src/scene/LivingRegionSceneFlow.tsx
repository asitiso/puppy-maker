import {useCallback,useEffect,useMemo} from 'react';
import MobileExplorationScene from '../exploration/MobileExplorationScene';
import {oldShrineExploration} from '../exploration/old-shrine-world';
import type {LivingRegionProgress,LivingRegionUpdate} from '../exploration/living-region-state';
import type {Personality} from '../game-tactical-base';
import {requestLivingRegionUpdate} from '../living-region-ui-events';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noop=()=>{};

type Props={
  regionId:'old_shrine';
  progress:LivingRegionProgress;
  personality:Personality;
  affection:number;
  worldFacts:readonly string[];
  inheritedWorldFacts:readonly string[];
  onExit:()=>void;
};

export default function LivingRegionSceneFlow({
  regionId,progress,personality,affection,worldFacts,inheritedWorldFacts,onExit,
}:Props){
  const factsKey=worldFacts.join('\u0000');
  const inheritedFactsKey=inheritedWorldFacts.join('\u0000');
  const exploration=useMemo(()=>oldShrineExploration(progress,{
    personality,affection,worldFacts,inheritedWorldFacts,
  }),[
    progress.phase,personality.courage,personality.kindness,personality.curiosity,personality.calmness,
    affection,factsKey,inheritedFactsKey,
  ]);
  const onUpdate=useCallback((update:LivingRegionUpdate)=>requestLivingRegionUpdate(regionId,update),[regionId]);

  useEffect(()=>{
    if(progress.phase==='unvisited')onUpdate({kind:'enter'});
  },[onUpdate,progress.phase]);

  const handleInteractionComplete=useCallback((interactionId:string)=>{
    onUpdate({kind:'recordInteraction',interactionId});
    const discoveryId=exploration.discoveryByInteraction[interactionId];
    if(discoveryId)onUpdate({kind:'recordDiscovery',discoveryId});
    if(interactionId===exploration.questStartInteractionId)onUpdate({kind:'startMainQuest'});
    if(interactionId===exploration.questResolveInteractionId)onUpdate({kind:'resolveMainQuest'});
    if(interactionId===exploration.postResolutionInteractionId&&progress.phase==='mainQuestResolved'){
      onUpdate({kind:'advancePostResolution'});
    }
  },[exploration,onUpdate,progress.phase]);

  return <MobileExplorationScene
    world={exploration.world}
    storyFrames={exploration.storyFrames}
    playerArtSrc={runaExplorationArt}
    completedInteractionIds={progress.completedInteractions}
    onInteractionComplete={handleInteractionComplete}
    onProgress={noop}
    onExit={onExit}
  />;
}
