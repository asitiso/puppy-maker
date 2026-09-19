import {useEffect,useState,type ReactNode} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {FACILITY_SYSTEM_DESTINATION,rpgFacilityWorld,type RpgFacilityFeatureId} from './exploration/rpg-facility-worlds';
import './rpg-facility-feature.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={
  feature:RpgFacilityFeatureId;
  state:GameState;
  onExit:()=>void;
  renderSystem:(returnToRoom:()=>void)=>ReactNode;
};

export default function RpgFacilityFeature({feature,state,onExit,renderSystem}:Props){
  const [systemOpen,setSystemOpen]=useState(false);
  useEffect(()=>setSystemOpen(false),[feature]);
  const world=rpgFacilityWorld(feature);
  const returnToRoom=()=>setSystemOpen(false);

  if(systemOpen){
    return <section className="rpg-facility-system" aria-label={`${world.label} 시스템`}>
      {renderSystem(returnToRoom)}
    </section>;
  }

  return <section className="rpg-facility-room" aria-label={`${world.label} 시설 내부`}>
    <MobileExplorationScene
      world={world}
      storyFrames={noStoryFrames}
      playerArtSrc={runaExplorationArt}
      onProgress={noop}
      onExit={onExit}
      onPortal={destinationId=>{
        if(destinationId===FACILITY_SYSTEM_DESTINATION)setSystemOpen(true);
      }}
    />
    <aside className="rpg-facility-room__tracker" aria-label="시설 상태">
      <small>FACILITY · {world.label}</small>
      <strong>시설 중심부로 이동</strong>
      <span>{state.year}년차 · 성장 PT {state.growthPoints} · {state.gold.toLocaleString()}G</span>
    </aside>
  </section>;
}
