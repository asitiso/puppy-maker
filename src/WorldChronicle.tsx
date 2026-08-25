import {
  legacyWorldMarkerLabels,
  publicProjectDefinitions,
  publicProjectIds,
  type GenerationalWorldState,
  type PublicProjectId,
} from './generational-world';
import {requestPublicProjectStart} from './public-project-ui-events';
import './world-chronicle.css';

type Props={generation:number;world:GenerationalWorldState};

export default function WorldChronicle({generation,world}:Props){
  const visibleMarkers=world.legacyMarkers.slice(0,3);
  const remainingProjects=publicProjectIds.filter(id=>!world.completedProjects.includes(id));
  const activeDefinition=world.activeProject?publicProjectDefinitions[world.activeProject]:null;
  const start=(id:PublicProjectId)=>requestPublicProjectStart(id);

  return <section className="world-chronicle" aria-label="세대 세계 연대기">
    <header className="world-chronicle__header">
      <div><small>LIVING WORLD</small><h3>{generation}세대의 세계</h3></div>
      <span>완성 {world.completedProjects.length}/{publicProjectIds.length}</span>
    </header>

    <div className="world-chronicle__legacy" aria-label="이어진 세계의 흔적">
      <small>이어진 세계의 흔적</small>
      <div className="world-chronicle__chips">
        {visibleMarkers.length
          ? visibleMarkers.map(marker=><span key={marker}>{legacyWorldMarkerLabels[marker]}</span>)
          : <span className="is-empty">아직 다음 세대에 새겨진 흔적이 없어요.</span>}
      </div>
    </div>

    <div className="world-chronicle__project">
      <div className="world-chronicle__project-title"><small>장기 세계 프로젝트</small>{activeDefinition&&<b>{world.projectProgress}%</b>}</div>
      {world.activeProject&&activeDefinition ? <>
        <strong>{activeDefinition.label}</strong>
        <p>{activeDefinition.description}</p>
        <div className="world-chronicle__progress" role="progressbar" aria-label={`${activeDefinition.label} 진행도`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={world.projectProgress}><i style={{width:`${world.projectProgress}%`}}/></div>
        <em>‘세계’ 주간 활동을 마치면 10%씩 진행돼요.</em>
      </> : remainingProjects.length ? <>
        <p>이번 세대가 후대에 남길 공동 과업을 하나 선택하세요.</p>
        <div className="world-chronicle__choices">
          {remainingProjects.map(id=>{
            const definition=publicProjectDefinitions[id];
            return <button key={id} type="button" onClick={()=>start(id)}><b>{definition.label}</b><small>{definition.description}</small></button>;
          })}
        </div>
      </> : <p className="world-chronicle__complete">모든 장기 세계 프로젝트가 후대의 기반으로 남았습니다.</p>}
    </div>
  </section>;
}
