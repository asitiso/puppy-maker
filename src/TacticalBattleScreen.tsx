import {useEffect,useMemo,useRef,useState} from 'react';
import type {BattleResult,BattleSession} from './tactical-battle';
import {resolveTacticalAction} from './tactical-engine';
import {chooseTacticalEngineAction} from './tactical-ai';
import {buildTacticalBattleView} from './tactical-ui';
import type {TacticalActionId} from './tactical-actions';
import './tactical-battle.css';

export type TacticalBattleScreenProps={
  session:BattleSession;
  auto:boolean;
  speed:1|2;
  onToggleAuto?:()=>void;
  onToggleSpeed?:()=>void;
  onSessionChange?:(session:BattleSession)=>void;
  onComplete?:(result:BattleResult,session:BattleSession)=>void;
  onRetry?:()=>void;
  onExit?:()=>void;
};

export function TacticalBattleScreen({session,auto,speed,onToggleAuto,onToggleSpeed,onSessionChange,onComplete,onRetry,onExit}:TacticalBattleScreenProps){
  const [current,setCurrent]=useState(session);
  const [selectedAction,setSelectedAction]=useState<TacticalActionId|null>(null);
  const [log,setLog]=useState<string[]>([]);
  const completedRef=useRef<BattleResult|null>(null);
  useEffect(()=>{setCurrent(session);setSelectedAction(null);setLog([]);completedRef.current=null},[session]);
  const v=useMemo(()=>buildTacticalBattleView(current,auto,speed,selectedAction),[current,auto,speed,selectedAction]);
  const activeRaw=current.units.find(unit=>unit.id===v.activeActorId)??null;

  const commit=(next:BattleSession,message:string)=>{
    if(next===current)return;
    setCurrent(next);setSelectedAction(null);setLog(previous=>[message,...previous].slice(0,5));onSessionChange?.(next);
  };

  useEffect(()=>{
    if(v.result){if(completedRef.current!==v.result){completedRef.current=v.result;onComplete?.(v.result,current)}return;}
    if(!activeRaw||(activeRaw.side==='ally'&&!auto))return;
    const move=chooseTacticalEngineAction(current,activeRaw.id,current.seed+current.round+current.acted.length);
    if(!move)return;
    const next=resolveTacticalAction(current,move);
    if(next!==current){const timer=window.setTimeout(()=>commit(next,`${activeRaw.id} · ${move.actionId.toUpperCase()}`),speed===2?90:180);return()=>window.clearTimeout(timer)}
  },[activeRaw,auto,current,onComplete,speed,v.result]);

  const chooseAction=(id:TacticalActionId)=>{
    if(!activeRaw||activeRaw.side!=='ally'||auto||v.result)return;
    if(!v.actions.some(action=>action.id===id))return;
    setSelectedAction(id);
  };
  const chooseTarget=(targetId:string)=>{
    if(!selectedAction||!activeRaw||activeRaw.side!=='ally'||!v.validTargetIds.includes(targetId))return;
    const next=resolveTacticalAction(current,{actorId:activeRaw.id,actionId:selectedAction,targetId});
    commit(next,`${activeRaw.id} · ${selectedAction.toUpperCase()} → ${targetId}`);
  };

  return <section className="tactical-screen" aria-label="Tactical battle">
    <header><strong>3 VS 3</strong><span>ROUND {v.round}</span><button onClick={onToggleAuto}>{v.autoLabel}</button><button onClick={onToggleSpeed}>{v.speedLabel}</button></header>
    <div className="tactical-timeline">{v.timeline.map(id=><span key={id} className={id===v.activeActorId?'active':''}>{id}</span>)}</div>
    <div className="tactical-field">
      <div className="tactical-team enemies">{v.enemies.map(u=><article key={u.id} onClick={()=>chooseTarget(u.id)} className={`unit ${u.position} ${u.active?'active':''} ${v.validTargetIds.includes(u.id)?'targetable':''} ${!u.alive?'down':''}`}><b>{u.id}</b><progress max={u.maxHp} value={u.hp}/><small>HP {u.hp}/{u.maxHp} · SH {u.shield}</small><small>AP {u.ap}/{u.maxAp} · MP {u.mp}/{u.maxMp}</small>{u.statuses.length?<em>{u.statuses.join(' · ')}</em>:null}</article>)}</div>
      <div className="tactical-team allies">{v.allies.map(u=><article key={u.id} onClick={()=>chooseTarget(u.id)} className={`unit ${u.position} ${u.active?'active':''} ${v.validTargetIds.includes(u.id)?'targetable':''} ${!u.alive?'down':''}`}><b>{u.id}</b><progress max={u.maxHp} value={u.hp}/><small>HP {u.hp}/{u.maxHp} · SH {u.shield}</small><small>AP {u.ap}/{u.maxAp} · MP {u.mp}/{u.maxMp}</small>{u.statuses.length?<em>{u.statuses.join(' · ')}</em>:null}</article>)}</div>
    </div>
    <div className="tactical-log">{log.length?log.map((line,index)=><span key={`${line}-${index}`}>{line}</span>):<span>{activeRaw?.side==='ally'?'행동을 선택하세요.':'적의 행동을 기다리는 중...'}</span>}</div>
    <footer className="tactical-hand">{(['attack','skill','support','special'] as TacticalActionId[]).map(id=>{const action=v.actions.find(item=>item.id===id);return <button key={id} className={selectedAction===id?'selected':''} disabled={!action||activeRaw?.side!=='ally'||auto||Boolean(v.result)} onClick={()=>chooseAction(id)}>{id.toUpperCase()}{action?<small> AP{action.apCost}{action.mpCost?` · MP${action.mpCost}`:''}</small>:null}</button>})}</footer>
    {v.result?<div className="tactical-result" role="dialog" aria-label="전투 결과"><strong>{v.result==='victory'?'VICTORY':'DEFEAT'}</strong><span>ROUND {v.round}</span><div>{onRetry?<button onClick={onRetry}>RETRY</button>:null}{onExit?<button onClick={onExit}>EXIT</button>:null}</div></div>:null}
  </section>
}
export default TacticalBattleScreen;
