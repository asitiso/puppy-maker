import {useEffect,useMemo,useRef,useState} from 'react';
import type {BattleResult,BattleSession} from './tactical-battle';
import type {CompanionId} from './tactical-companions';
import {resolveTacticalAction} from './tactical-engine';
import {chooseAutoCombinationUltimate,chooseTacticalEngineAction} from './tactical-ai';
import {buildCombinationUltimateViews,buildTacticalBattleView} from './tactical-ui';
import {resolveCombinationUltimate} from './tactical-ultimate';
import type {TacticalActionId} from './tactical-actions';
import './tactical-battle.css';

export type TacticalBattleScreenProps={
  session:BattleSession;
  auto:boolean;
  speed:1|2;
  party?:readonly CompanionId[];
  bondLevels?:Partial<Record<CompanionId,number>>;
  onToggleAuto?:()=>void;
  onToggleSpeed?:()=>void;
  onSessionChange?:(session:BattleSession)=>void;
  onComplete?:(result:BattleResult,session:BattleSession)=>void;
  onRetry?:()=>void;
  onExit?:()=>void;
};

const EMPTY_PARTY:readonly CompanionId[]=[];
const EMPTY_BOND_LEVELS:Partial<Record<CompanionId,number>>={};

export function TacticalBattleScreen({session,auto,speed,party=EMPTY_PARTY,bondLevels=EMPTY_BOND_LEVELS,onToggleAuto,onToggleSpeed,onSessionChange,onComplete,onRetry,onExit}:TacticalBattleScreenProps){
  const [current,setCurrent]=useState(session);
  const [selectedAction,setSelectedAction]=useState<TacticalActionId|null>(null);
  const [selectedUltimate,setSelectedUltimate]=useState<CompanionId|null>(null);
  const [log,setLog]=useState<string[]>([]);
  const completedRef=useRef<BattleResult|null>(null);
  useEffect(()=>{setCurrent(session);setSelectedAction(null);setSelectedUltimate(null);setLog([]);completedRef.current=null},[session]);
  const v=useMemo(()=>buildTacticalBattleView(current,auto,speed,selectedAction),[current,auto,speed,selectedAction]);
  const ultimateViews=useMemo(()=>buildCombinationUltimateViews(current,party,bondLevels),[current,party,bondLevels]);
  const selectedUltimateView=selectedUltimate?ultimateViews.find(view=>view.companionId===selectedUltimate)??null:null;
  const validTargetIds=selectedUltimateView?.targetIds??v.validTargetIds;
  const activeRaw=current.units.find(unit=>unit.id===v.activeActorId)??null;

  const commit=(next:BattleSession,message:string)=>{
    if(next===current)return;
    setCurrent(next);setSelectedAction(null);setSelectedUltimate(null);setLog(previous=>[message,...previous].slice(0,5));onSessionChange?.(next);
  };

  useEffect(()=>{
    if(v.result){if(completedRef.current!==v.result){completedRef.current=v.result;onComplete?.(v.result,current)}return;}
    if(!activeRaw||(activeRaw.side==='ally'&&!auto))return;
    if(activeRaw.side==='ally'&&auto){
      const ultimateMove=chooseAutoCombinationUltimate(current,party,bondLevels);
      if(ultimateMove){
        const next=resolveCombinationUltimate(current,ultimateMove);
        if(next!==current){
          const label=ultimateViews.find(view=>view.companionId===ultimateMove.companionId)?.label??ultimateMove.companionId;
          const timer=window.setTimeout(()=>commit(next,`${activeRaw.id} · ${label} → ${ultimateMove.targetId}`),speed===2?90:180);
          return()=>window.clearTimeout(timer);
        }
      }
    }
    const move=chooseTacticalEngineAction(current,activeRaw.id,current.seed+current.round+current.acted.length);
    if(!move)return;
    const next=resolveTacticalAction(current,move);
    if(next!==current){const timer=window.setTimeout(()=>commit(next,`${activeRaw.id} · ${move.actionId.toUpperCase()}`),speed===2?90:180);return()=>window.clearTimeout(timer)}
  },[activeRaw,auto,bondLevels,current,onComplete,party,speed,ultimateViews,v.result]);

  const chooseAction=(id:TacticalActionId)=>{
    if(!activeRaw||activeRaw.side!=='ally'||auto||v.result)return;
    if(!v.actions.some(action=>action.id===id))return;
    setSelectedUltimate(null);
    setSelectedAction(id);
  };
  const chooseUltimate=(companionId:CompanionId)=>{
    if(!activeRaw||activeRaw.id!=='runa'||activeRaw.side!=='ally'||auto||v.result)return;
    const ultimate=ultimateViews.find(view=>view.companionId===companionId);
    if(!ultimate?.available)return;
    setSelectedAction(null);
    setSelectedUltimate(companionId);
  };
  const chooseTarget=(targetId:string)=>{
    if(!activeRaw||activeRaw.side!=='ally'||!validTargetIds.includes(targetId))return;
    if(selectedUltimate){
      const bondLevel=bondLevels[selectedUltimate]??1;
      const next=resolveCombinationUltimate(current,{actorId:activeRaw.id,companionId:selectedUltimate,bondLevel,targetId});
      const label=ultimateViews.find(view=>view.companionId===selectedUltimate)?.label??selectedUltimate;
      commit(next,`${activeRaw.id} · ${label} → ${targetId}`);
      return;
    }
    if(!selectedAction)return;
    const next=resolveTacticalAction(current,{actorId:activeRaw.id,actionId:selectedAction,targetId});
    commit(next,`${activeRaw.id} · ${selectedAction.toUpperCase()} → ${targetId}`);
  };

  return <section className="tactical-screen" aria-label="Tactical battle">
    <header><strong>3 VS 3</strong><span>ROUND {v.round}</span><button onClick={onToggleAuto}>{v.autoLabel}</button><button onClick={onToggleSpeed}>{v.speedLabel}</button></header>
    <div className="tactical-timeline">{v.timeline.map(id=><span key={id} className={id===v.activeActorId?'active':''}>{id}</span>)}</div>
    <div className="tactical-field">
      <div className="tactical-team enemies">{v.enemies.map(u=><article key={u.id} onClick={()=>chooseTarget(u.id)} className={`unit ${u.position} ${u.active?'active':''} ${validTargetIds.includes(u.id)?'targetable':''} ${!u.alive?'down':''}`}><b>{u.id}</b><progress max={u.maxHp} value={u.hp}/><small>HP {u.hp}/{u.maxHp} · SH {u.shield}</small><small>AP {u.ap}/{u.maxAp} · MP {u.mp}/{u.maxMp}</small>{u.statuses.length?<em>{u.statuses.join(' · ')}</em>:null}</article>)}</div>
      <div className="tactical-team allies">{v.allies.map(u=><article key={u.id} onClick={()=>chooseTarget(u.id)} className={`unit ${u.position} ${u.active?'active':''} ${validTargetIds.includes(u.id)?'targetable':''} ${!u.alive?'down':''}`}><b>{u.id}</b><progress max={u.maxHp} value={u.hp}/><small>HP {u.hp}/{u.maxHp} · SH {u.shield}</small><small>AP {u.ap}/{u.maxAp} · MP {u.mp}/{u.maxMp}</small>{u.statuses.length?<em>{u.statuses.join(' · ')}</em>:null}</article>)}</div>
    </div>
    <div className="tactical-log">{log.length?log.map((line,index)=><span key={`${line}-${index}`}>{line}</span>):<span>{activeRaw?.side==='ally'?'행동을 선택하세요.':'적의 행동을 기다리는 중...'}</span>}</div>
    {ultimateViews.length?<div className="tactical-ultimates" aria-label="Bond Lv5 합동기">{ultimateViews.map(ultimate=><button key={ultimate.companionId} className={selectedUltimate===ultimate.companionId?'selected':''} disabled={!ultimate.available||activeRaw?.id!=='runa'||auto||Boolean(v.result)} onClick={()=>chooseUltimate(ultimate.companionId)}><b>{ultimate.label}</b><small>MP {ultimate.mpCost} · BOND 5</small></button>)}</div>:null}
    <footer className="tactical-hand">{(['attack','skill','support','special'] as TacticalActionId[]).map(id=>{const action=v.actions.find(item=>item.id===id);return <button key={id} className={selectedAction===id?'selected':''} disabled={!action||activeRaw?.side!=='ally'||auto||Boolean(v.result)} onClick={()=>chooseAction(id)}>{id.toUpperCase()}{action?<small> AP{action.apCost}{action.mpCost?` · MP${action.mpCost}`:''}</small>:null}</button>})}</footer>
    {v.result?<div className="tactical-result" role="dialog" aria-label="전투 결과"><strong>{v.result==='victory'?'VICTORY':'DEFEAT'}</strong><span>ROUND {v.round}</span><div>{onRetry?<button onClick={onRetry}>RETRY</button>:null}{onExit?<button onClick={onExit}>EXIT</button>:null}</div></div>:null}
  </section>
}
export default TacticalBattleScreen;
