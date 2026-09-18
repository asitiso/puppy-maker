import type {GameState} from './game';
import LineageChronicle from './LineageChronicle';
import MobilePageShell from './MobilePageShell';
import WorldChronicle from './WorldChronicle';
import type {MobileFeatureId} from './mobile-router';
import './rpg-chronicle-feature.css';

type ChronicleFeature='lineage'|'world_chronicle';

type Props={
  feature:ChronicleFeature;
  state:GameState;
  onBack:()=>void;
};

export default function RpgChronicleFeature({feature,state,onBack}:Props){
  const lineage=feature==='lineage';
  const title=lineage?'가문 연대기':'세계 연대기';
  const subtitle=lineage
    ?'세대를 거치며 이어진 성장과 계승의 흔적'
    :'선택과 사건이 세계에 남긴 변화의 기록';

  return <MobilePageShell
    title={title}
    subtitle={subtitle}
    backgroundSlot="category.records.background"
    scrollKey={`feature:${feature}`}
    onBack={onBack}
    className="rpg-chronicle-feature"
  >
    <header className="rpg-chronicle-feature__hero">
      <small>ARCHIVE · {lineage?'LINEAGE':'WORLD'}</small>
      <strong>{lineage?`GENERATION ${state.lineage.generation}`:'WORLD MEMORY'}</strong>
      <p>{lineage?'지금까지 이어온 성장 경로와 세대의 흔적을 확인하세요.':`현재 세계에 남은 발견 ${state.discoveries.length}개와 장기 변화를 확인하세요.`}</p>
    </header>
    <section className="rpg-chronicle-feature__ledger" aria-label={title}>
      {lineage
        ?<LineageChronicle state={state}/>
        :<WorldChronicle generation={state.lineage.generation} world={state.generationalWorld}/>}
    </section>
  </MobilePageShell>;
}

export type {ChronicleFeature};
