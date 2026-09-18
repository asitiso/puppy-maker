import {useCallback,useEffect,useMemo} from 'react';
import {livingRegionExplorationBuilders} from '../exploration/living-region-explorations';
import MobileExplorationScene from '../exploration/MobileExplorationScene';
import type {LivingRegionProgress,LivingRegionUpdate} from '../exploration/living-region-state';
import type {LivingRegionId} from '../exploration/region-registry';
import type {Personality} from '../game-tactical-base';
import {requestLivingRegionUpdate,requestLivingRegionUpdates} from '../living-region-ui-events';
const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noop=()=>{};
type Props={regionId:LivingRegionId;progress:LivingRegionProgress;personality:Personality;affection:number;worldFacts:readonly string[];inheritedWorldFacts:readonly string[];onExit:()=>void};
export default function LivingRegionSceneFlow({regionId,progress,personality,affection,worldFacts,inheritedWorldFacts,onExit}:Props){
 const factsKey=worldFacts.join('\u0000');const inheritedFactsKey=inheritedWorldFacts.join('\u0000');
 const exploration=useMemo(()=>livingRegionExplorationBuilders[regionId](progress,{personality,affection,worldFacts,inheritedWorldFacts}),[regionId,progress.phase,personality.courage,personality.kindness,personality.curiosity,personality.calmness,affection,factsKey,inheritedFactsKey]);
 const onUpdate=useCallback((update:LivingRegionUpdate)=>requestLivingRegionUpdate(regionId,update),[regionId]);
 useEffect(()=>{if(progress.phase==='unvisited')onUpdate({kind:'enter'});},[onUpdate,progress.phase]);
 const handleInteractionComplete=useCallback((interactionId:string)=>{
  const updates:LivingRegionUpdate[]=[{kind:'recordInteraction',interactionId}];
  const discoveryId=exploration.discoveryByInteraction[interactionId];
  if(discoveryId)updates.push({kind:'recordDiscovery',discoveryId});
  if(interactionId===exploration.questStartInteractionId)updates.push({kind:'startMainQuest'});
  if(interactionId===exploration.questResolveInteractionId)updates.push({kind:'resolveMainQuest'});
  if(interactionId===exploration.postResolutionInteractionId&&progress.phase==='mainQuestResolved')updates.push({kind:'advancePostResolution'});
  requestLivingRegionUpdates(regionId,updates);
 },[exploration,progress.phase,regionId]);
 return <MobileExplorationScene world={exploration.world} storyFrames={exploration.storyFrames} playerArtSrc={runaExplorationArt} completedInteractionIds={progress.completedInteractions} onInteractionComplete={handleInteractionComplete} onProgress={noop} onExit={onExit}/>;
}
