import {useEffect,useRef,type KeyboardEvent} from 'react';
import type {MobileWorldRecommendation} from './mobile-category-guidance';
import type {WorldQuestContract,WorldQuestHistory} from './world-quest-contract';
import {npcQuestProgress} from './world-quest-contract';
import type {WorldQuestNpc} from './world-quest-npcs';

type Props={
  npc:WorldQuestNpc;
  recommendation:MobileWorldRecommendation;
  activeQuest:WorldQuestContract|null;
  history:WorldQuestHistory;
  continuous:boolean;
  onClose:()=>void;
  onAccept:()=>void;
  onAbandon:()=>void;
  onTurnIn:()=>void;
  onToggleContinuous:()=>void;
};

export default function WorldQuestNpcDialog({
  npc,recommendation,activeQuest,history,continuous,
  onClose,onAccept,onAbandon,onTurnIn,onToggleContinuous,
}:Props){
  const dialogRef=useRef<HTMLElement|null>(null);
  const issuerCompleted=history.completedByIssuer[npc.id]??0;
  const progress=npcQuestProgress(issuerCompleted);
  const recent=history.recent.filter(entry=>entry.issuerId===npc.id).slice(0,3);
  const ownsActive=activeQuest?.category===npc.category;
  const ready=Boolean(ownsActive&&activeQuest?.readyToTurnIn);
  const dialogBadge=ready?'?':ownsActive?'·':activeQuest?'':'!';

  useEffect(()=>{
    const close=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}};
    window.addEventListener('keydown',close);
    return ()=>window.removeEventListener('keydown',close);
  },[onClose]);

  const trapFocus=(event:KeyboardEvent<HTMLElement>)=>{
    if(event.key!=='Tab')return;
    const controls=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if(controls.length===0)return;
    const first=controls[0],last=controls[controls.length-1];
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  };

  const status=ready
    ?'의뢰 목표를 달성했습니다. NPC에게 완료를 보고하면 신뢰도와 기록이 반영됩니다.'
    :ownsActive
      ?'수행 중인 의뢰가 있습니다. 목표 시설에서 행동을 마친 뒤 다시 찾아오세요.'
      :activeQuest
        ?`${activeQuest.issuerName??'다른 NPC'}의 의뢰를 수행 중입니다. 먼저 그 의뢰를 마쳐야 새 의뢰를 받을 수 있어요.`
        :npc.greeting;

  return <div className="world-quest-dialog__backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <section ref={dialogRef} className="world-quest-dialog" role="dialog" aria-modal="true" aria-labelledby="world-quest-dialog-title" onKeyDown={trapFocus}>
      <header>
        <div className="world-quest-dialog__portrait">
          <img src={npc.portraitSrc} alt="" draggable={false}/>
          {dialogBadge?<span data-tone={ready?'ready':ownsActive?'active':'quest'} aria-hidden="true">{dialogBadge}</span>:null}
        </div>
        <div><small>WORLD QUEST NPC</small><h2 id="world-quest-dialog-title">{npc.name}</h2><p>{npc.role}</p></div>
        <button type="button" className="world-quest-dialog__close" aria-label="대화 닫기" onClick={onClose}>×</button>
      </header>
      <div className="world-quest-dialog__trust">
        <span><b>{progress.rank}</b><small>완료 {issuerCompleted}건</small></span>
        <progress value={progress.percent} max="100">{progress.percent}%</progress>
        <em>{progress.nextRank?`다음 관계 ${progress.nextRank}까지 ${progress.remaining}건`:'최고 관계 단계'}</em>
      </div>
      <article className={`world-quest-dialog__contract${ready?' is-ready':''}`}>
        <small>{ready?'TURN IN':ownsActive?'ACTIVE CONTRACT':activeQuest?'BUSY':'NEW CONTRACT'}</small>
        <strong>{ownsActive?activeQuest!.title:activeQuest?'현재 다른 의뢰 수행 중':recommendation.label}</strong>
        <p>{ownsActive?activeQuest!.reason:activeQuest?status:recommendation.reason}</p>
        <span>{status}</span>
      </article>
      <div className="world-quest-dialog__actions">
        {ready?<button type="button" className="is-primary" autoFocus onClick={onTurnIn}>완료 보고</button>
          :ownsActive?<><button type="button" className="is-primary" autoFocus onClick={onClose}>의뢰 계속하기</button><button type="button" onClick={onAbandon}>의뢰 포기</button></>
          :activeQuest?<button type="button" className="is-primary" autoFocus onClick={onClose}>대화 마치기</button>
          :<button type="button" className="is-primary" autoFocus onClick={onAccept}>의뢰 수락</button>}
        <button type="button" aria-pressed={continuous} onClick={onToggleContinuous}>{continuous?'연속 의뢰 끄기':'완료 후 다음 의뢰 자동 수락'}</button>
      </div>
      {recent.length>0&&<details className="world-quest-dialog__journal"><summary>{npc.name}와 완료한 최근 의뢰</summary>{recent.map((entry,index)=><span key={`${entry.completedAt}:${index}`}>✓ {entry.title}</span>)}</details>}
    </section>
  </div>;
}
