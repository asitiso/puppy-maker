import type {GameState} from './game';
import {canStartNextGeneration,heritageTraitDefinitions,lifeStageLabel,type LineageRouteId} from './lineage';
import {nextGenerationRequestEvent} from './lineage-ui-events';

const routeLabels:Record<LineageRouteId,string>={
  caretaker:'Caretaker',pathfinder:'Pathfinder',vanguard:'Vanguard',arcanist:'Arcanist',true_path:'True Path',hollow:'Hollow Path',
};

type Props={state:GameState;onStartNextGeneration?:()=>void};

export default function LineageChronicle({state,onStartNextGeneration}:Props){
  const canAdvance=canStartNextGeneration({year:state.year,resolvedEnding:state.resolvedEnding,campaignCompleted:false});
  const ancestors=state.lineage.ancestors.slice(-3).reverse();
  const startNextGeneration=()=>{
    if(onStartNextGeneration)return onStartNextGeneration();
    window.dispatchEvent(new Event(nextGenerationRequestEvent));
  };

  return <details className="lineage-chronicle">
    <summary><span>가문 연대기</span><b>{state.lineage.generation}세대 · {state.year}년차</b><small>{lifeStageLabel(state.year)}</small></summary>
    <div className="lineage-chronicle-body">
      <div className="lineage-heritage"><small>HERITAGE</small>{state.lineage.heritageTraits.length
        ? <div>{state.lineage.heritageTraits.map(id=><span key={id}>{heritageTraitDefinitions[id].label}</span>)}</div>
        : <p>아직 다음 세대에 남은 가문의 기억이 없어요.</p>}
      </div>
      <div className="lineage-ancestors"><small>ANCESTORS</small>{ancestors.length
        ? ancestors.map(ancestor=><article key={ancestor.generation}><b>{ancestor.generation}세대</b><span>{ancestor.route?routeLabels[ancestor.route]:'기록되지 않은 길'} · {ancestor.yearsLived}년</span></article>)
        : <p>첫 세대의 이야기가 지금 쓰이고 있어요.</p>}
      </div>
      {canAdvance&&<div className="lineage-next-generation"><p>새 삶은 능력치가 아니라 기억을 이어받아요.</p><button type="button" onClick={startNextGeneration}>다음 세대 시작</button></div>}
    </div>
  </details>;
}
