import { useEffect, useReducer, useRef, useState } from 'react';
import { activities, initialState, masteryLevel, reducer, trainingQuality, type Action, type ActivityId, type GameState } from './game';
import { FINISHER_COMBO_THRESHOLD } from './game/finisher';
import { hydrateSave, serializeGameState } from './game/save';
import { generateSequence, sequenceAccuracy, type RuneId } from './game/minigames/sequence';
import { breathAccuracy } from './game/minigames/rhythm';
import { pickTarget, spotAccuracy } from './game/minigames/spotmatch';
import { personalityFlavorLine, trainingResultLine } from './game/reaction';
import { runaPoseAsset } from './runa-presentation';
import { StoryEvent } from './components/StoryEvent';
import { GrowthReport } from './components/GrowthReport';
import { EndingScreen } from './components/EndingScreen';
const iconPaths:Record<string,string>={sword:'M6 19l4-4m0 0 7-7 2-4-4 2-7 7m2 2 3 3m-7-1 3 3',spark:'M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z',moon:'M18 16.8A8 8 0 118.2 5a6.5 6.5 0 009.8 11.8z',leaf:'M5 19c7 0 12-5 14-14C10 6 5 11 5 19zm0 0c3-4 6-7 10-9',calendar:'M5 5h14v14H5zM8 3v4m8-4v4M5 9h14',bag:'M7 8h10l1 11H6L7 8zm3 0V6a2 2 0 014 0v2',quest:'M6 4h12v16H6zM9 8h6m-6 4h6m-6 4h4',map:'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',heart:'M12 20S4 15 4 9a4 4 0 017-2 4 4 0 017 2c0 6-6 11-6 11z'};
function Icon({name}:{name:string}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]}/></svg>}
const petArt={happy:runaPoseAsset('idle'),focus:runaPoseAsset('training-ready'),shy:runaPoseAsset('talk'),tired:runaPoseAsset('tired')} as const; function Pet({mood='happy'}:{mood?:keyof typeof petArt}){return <div className={`pet pet-${mood}`} aria-label="수호 여우 루나"><div className="pet-aura"/><img src={petArt[mood]} alt="수호 여우 루나"/></div>}
const conditionLabel=(c:GameState['condition'])=>c==='energetic'?'활기참':c==='focused'?'집중':c==='tired'?'피곤':'평온';
function Hub({state,go}:{state:GameState;go:()=>void}){return <section className="screen hub-screen"><button className="primary" onClick={go}>이번 달 일정 짜기</button><Pet mood={state.condition==='tired'?'tired':'happy'}/></section>}
const activityHint:Record<ActivityId,string>={hunt:'근력 크게 ↑ · 피로 ↑↑ · 스트레스 ↑',magic:'마력·지능 ↑ · 피로 ↑',rest:'피로 ↓↓↓ · 스트레스 ↓↓↓ · 호감 ↑',herb:'지능 ↑ · 피로 소폭 ↑ · 침착함 ↑'},trainingCopy:Record<ActivityId,{title:string;instruction:string;actions:[string,string,string]}>= {hunt:{title:'사냥 훈련',instruction:'표적이 빛나는 순간을 노려 공격하세요.',actions:['공격','회피','기 모으기']},magic:{title:'마법 수업',instruction:'집중 타이밍에 맞춰 마력을 안정시키세요.',actions:['주문','집중','마력 모으기']},rest:{title:'포근한 휴식',instruction:'호흡 타이밍을 맞춰 피로를 천천히 풀어주세요.',actions:['기지개','심호흡','쉬어가기']},herb:{title:'약초 채집',instruction:'반짝이는 순간에 맞춰 좋은 약초를 골라주세요.',actions:['채집','살피기','집중하기']}};
function Schedule({state,dispatch}:{state:GameState;dispatch:React.Dispatch<Action>}){const ids=Object.keys(activities) as ActivityId[];return <section className="screen diary-screen"><div className="diary-bg"/><button className="back-button" aria-label="홈으로 돌아가기" onClick={()=>dispatch({type:'GO',screen:'hub'})}/><div className="screen-title"><small>MONTHLY PLAN</small><h1>{state.month}월 성장 다이어리</h1><p className="condition-summary">현재 컨디션 <b>{conditionLabel(state.condition)}</b> · 피로 {state.stats.fatigue} · 스트레스 {state.stats.stress}</p></div><div className="book"><div className="week-list">{state.schedule.map((id,index)=><div className="week-row" key={index}><span className="week-label">{index+1}<small>WEEK</small></span><div className={`activity-card activity-${id}`}><span><Icon name={activities[id].icon}/></span><div><b>{activities[id].name}</b><small>{activityHint[id]}</small></div></div><button className="cycle" aria-label={`${index+1}주차 훈련 변경`} onClick={()=>dispatch({type:'SET_SCHEDULE',index,activity:ids[(ids.indexOf(id)+1)%ids.length]})}>↻</button></div>)}</div></div><Pet mood="focus"/><div className="planner-actions"><button className="secondary" onClick={()=>dispatch({type:'AUTO_SCHEDULE'})}>자동 배치</button><button className="primary" onClick={()=>dispatch({type:'GO',screen:'training'})}>일정 시작</button></div></section>}
// Each activity used to share one mechanic (spin a needle, tap in the
// sweet spot) with only the label text and background art swapped — the
// mini-games below give each activity its own actual interaction shape.
// All four report a 0-1 accuracy through the same onHit callback, which
// Training wires to the existing TRAIN action, so the reducer/scoring
// side is untouched.
type Quality='PERFECT!'|'GOOD!'|'NORMAL';
const qualityFor=(accuracy:number):Quality=>accuracy>.7?'PERFECT!':accuracy>.45?'GOOD!':'NORMAL';
// Hunt: fast reflex — a needle sweeps a ring, tap any of the three
// action buttons while it's in the sweet spot at the top.
// Finisher: once combo reaches the threshold (see game/finisher.ts), the
// [기 모으기] button pulses to invite a charge press; once charged, the
// [공격] button pulses instead and landing it triggers a bigger score
// burst and a distinct flash, matching GDD 3.4's "기 모으기 → 공격 연계".
function HuntGame({actions,onHit,combo,finisherCharged}:{actions:[string,string,string];onHit:(kind:'attack'|'dodge'|'charge',accuracy:number)=>void;combo:number;finisherCharged:boolean}){
  const[needle,setNeedle]=useState(.1),[flash,setFlash]=useState('');
  useEffect(()=>{const timer=setInterval(()=>setNeedle(v=>(v+.037)%1),40);return()=>clearInterval(timer)},[]);
  const accuracy=1-Math.min(1,Math.abs(.5-needle)*2);
  const finisherReady=combo>=FINISHER_COMBO_THRESHOLD&&!finisherCharged;
  const hit=(kind:'attack'|'dodge'|'charge')=>{const landsFinisher=kind==='attack'&&finisherCharged;onHit(kind,accuracy);setFlash(landsFinisher?'필살기!!':qualityFor(accuracy));setTimeout(()=>setFlash(''),landsFinisher?800:500)};
  return <><div className={`timing-ring${finisherCharged?' is-finisher-ready':''}`}><div className="sweet-spot"/><i style={{transform:`rotate(${needle*360}deg)`}}/><span>{flash||(finisherCharged?'필살기 준비!':'집중 타이밍')}</span></div><div className="action-bar"><button className={`attack${finisherCharged?' is-ready':''}`} onClick={()=>hit('attack')}><Icon name="sword"/><b>{actions[0]}</b></button><button className="dodge" onClick={()=>hit('dodge')}><b>{actions[1]}</b></button><button className={`charge${finisherReady?' is-ready':''}`} onClick={()=>hit('charge')}><Icon name="spark"/><b>{actions[2]}</b></button></div></>;
}
// Rest: slow breathing circle (long, calm cycle — the deliberate
// opposite of hunt's fast needle) — tap when it's fully expanded.
function RestGame({actions,onHit}:{actions:[string,string,string];onHit:(kind:'attack'|'dodge'|'charge',accuracy:number)=>void}){
  const[flash,setFlash]=useState('');const startedAt=useRef(Date.now());const PERIOD=3200;
  const hit=(kind:'attack'|'dodge'|'charge')=>{const accuracy=breathAccuracy(Date.now()-startedAt.current,PERIOD);onHit(kind,accuracy);setFlash(qualityFor(accuracy));setTimeout(()=>setFlash(''),500)};
  return <><div className="breath-circle" style={{animationDuration:`${PERIOD}ms`}}><span>{flash||'숨을 고르세요'}</span></div><div className="action-bar"><button className="attack" onClick={()=>hit('attack')}><b>{actions[0]}</b></button><button className="dodge" onClick={()=>hit('dodge')}><b>{actions[1]}</b></button><button className="charge" onClick={()=>hit('charge')}><b>{actions[2]}</b></button></div></>;
}
const RUNE_ICONS=['moon','spark','heart','leaf']as const;
// Magic: memorize a short rune sequence, then tap it back in order —
// a memory game, nothing about timing or reflexes.
function MagicGame({onHit}:{onHit:(kind:'attack'|'dodge'|'charge',accuracy:number)=>void}){
  const[target,setTarget]=useState<RuneId[]>(()=>generateSequence(4));
  const[phase,setPhase]=useState<'memorize'|'input'>('memorize');
  const[shown,setShown]=useState(0);const[input,setInput]=useState<RuneId[]>([]);const[flash,setFlash]=useState('');
  useEffect(()=>{setPhase('memorize');setShown(0);setInput([]);const timers:number[]=[];target.forEach((_,i)=>timers.push(window.setTimeout(()=>setShown(i+1),450*(i+1))));timers.push(window.setTimeout(()=>setPhase('input'),450*target.length+250));return()=>timers.forEach(clearTimeout)},[target]);
  const tap=(rune:RuneId)=>{if(phase!=='input')return;const next=[...input,rune];setInput(next);if(next.length>=target.length){const accuracy=sequenceAccuracy(target,next);onHit('dodge',accuracy);setFlash(qualityFor(accuracy));setTimeout(()=>{setFlash('');setTarget(generateSequence(4))},650)}};
  return <><div className="magic-status">{phase==='memorize'?'순서를 기억하세요':flash||'순서대로 탭하세요'}</div><div className="rune-row">{RUNE_ICONS.map((name,idx)=>{const lit=phase==='memorize'&&shown>0&&target[shown-1]===idx;return <button key={name} className={`rune${lit?' is-lit':''}`} disabled={phase!=='input'} onClick={()=>tap(idx as RuneId)}><Icon name={name}/></button>})}</div></>;
}
// Herb gathering: several patches appear, one briefly marked as the good
// herb — tap it before it fades. A reaction/attention game, not a
// rhythm or memory one.
function HerbGame({onHit}:{onHit:(kind:'attack'|'dodge'|'charge',accuracy:number)=>void}){
  const SPOTS=5,TIME_LIMIT=1400;
  const[target,setTarget]=useState(()=>pickTarget(SPOTS));const[shownAt,setShownAt]=useState(()=>Date.now());const[flash,setFlash]=useState('');
  useEffect(()=>{const timer=setTimeout(()=>{onHit('dodge',0);setFlash('MISS');setTimeout(()=>{setFlash('');setTarget(pickTarget(SPOTS));setShownAt(Date.now())},500)},TIME_LIMIT);return()=>clearTimeout(timer)},[target]);
  const tap=(spot:number)=>{const accuracy=spotAccuracy(target,spot,Date.now()-shownAt,TIME_LIMIT);onHit('dodge',accuracy);setFlash(accuracy>.7?'PERFECT!':accuracy>0?'GOOD!':'MISS');setTimeout(()=>{setFlash('');setTarget(pickTarget(SPOTS));setShownAt(Date.now())},500)};
  return <><div className="herb-status">{flash||'반짝이는 약초를 찾아 탭하세요'}</div><div className="spot-grid">{Array.from({length:SPOTS}).map((_,i)=><button key={i} className={`spot${i===target?' is-target':''}`} onClick={()=>tap(i)}><Icon name="leaf"/></button>)}</div></>;
}
function Training({state,dispatch}:{state:GameState;dispatch:React.Dispatch<Action>}){const id=state.schedule[Math.max(0,Math.min(3,state.week-1))],copy=trainingCopy[id],quality=trainingQuality(state.trainingScore);const onHit=(kind:'attack'|'dodge'|'charge',accuracy:number)=>dispatch({type:'TRAIN',kind,accuracy});return <section className={`screen training-screen training-${id}`}><div className="forest-arena"><div className="mist"/></div><div className="battle-hud"><button className="back-button" aria-label="일정으로 돌아가기" onClick={()=>dispatch({type:'GO',screen:'schedule'})}/><div><small>COMBO</small><b>{state.combo}</b>{state.finisherCharged&&<i className="finisher-badge">필살기!</i>}</div><div><span>{quality}</span><b>{state.trainingScore}</b></div><button onClick={()=>dispatch({type:'FINISH_TRAINING'})}>훈련 종료</button></div><div className="training-brief"><small>{state.week} WEEK · {conditionLabel(state.condition)}</small><b>{copy.title}</b><span>{copy.instruction}</span></div><div className="fighter"><Pet mood={state.condition==='tired'?'tired':'focus'}/></div>{id==='hunt'&&<HuntGame actions={copy.actions} onHit={onHit} combo={state.combo} finisherCharged={state.finisherCharged}/>}{id==='rest'&&<RestGame actions={copy.actions} onHit={onHit}/>}{id==='magic'&&<MagicGame onHit={onHit}/>}{id==='herb'&&<HerbGame onHit={onHit}/>}</section>}
function Dialogue({state,dispatch}:{state:GameState;dispatch:React.Dispatch<Action>}){const snackDisabled=state.gold<100;
// Used to be one fixed line no matter how training went or who Runa has
// grown into — now reflects the quality just achieved plus whichever
// personality trait she's leaning into most (see game/reaction.ts).
const lastActivity=state.schedule[Math.max(0,Math.min(3,state.week-1))],line=trainingResultLine(state.pendingGrowth?.quality??'NORMAL',lastActivity),flavor=personalityFlavorLine(state.personality);
return <section className="screen dialogue-screen"><div className="story-forest"/><div className="story-pet"><Pet mood="shy"/></div><div className="dialogue-box"><div className="nameplate">RUNA · 루나</div><p>{line}<br/>{flavor}</p><div className="choices"><button onClick={()=>dispatch({type:'CHOOSE',choice:'hug'})}>따뜻하게 안아준다 <small>마음을 편하게 해준다</small></button><button onClick={()=>dispatch({type:'CHOOSE',choice:'scold'})}>조금 더 엄하게 지도한다 <small>다음 도전을 준비한다</small></button><button disabled={snackDisabled} onClick={()=>dispatch({type:'CHOOSE',choice:'snack'})}>별빛 간식을 건넨다 <small>{snackDisabled?'100G 필요':'함께 간식을 나눈다 · 100G'}</small></button></div></div></section>}
// Reference size .shell-canvas is laid out at (see styles.css .shell-canvas
// comment) — keep these two in sync.
const SHELL_DESIGN_WIDTH=620;
// Measures the rendered .game-shell box and exposes its width as a
// --shell-scale CSS var so .shell-canvas can scale its fixed-px contents
// to match, instead of overflowing when the shell is smaller than the
// design canvas (see styles.css .shell-canvas).
function useShellScale<T extends HTMLElement>(){const ref=useRef<T>(null);useEffect(()=>{const el=ref.current;if(!el)return;const update=()=>{el.style.setProperty('--shell-scale',String(el.offsetWidth/SHELL_DESIGN_WIDTH))};update();const observer=new ResizeObserver(update);observer.observe(el);return()=>observer.disconnect()},[]);return ref}
export interface AppProps{state:GameState;dispatch:React.Dispatch<Action>;renderHub?:boolean;overlay?:React.ReactNode} export function GameApp({state,dispatch,renderHub=true,overlay}:AppProps){const shellRef=useShellScale<HTMLDivElement>();return <main className="page"><div className="game-shell" ref={shellRef}><div className="shell-canvas"><div className="ornate-corners"><i/><i/><i/><i/></div>{renderHub&&state.screen==='hub'&&<Hub state={state} go={()=>dispatch({type:'GO',screen:'schedule'})}/>} {state.screen==='schedule'&&<Schedule state={state} dispatch={dispatch}/>} {state.screen==='training'&&<Training state={state} dispatch={dispatch}/>} {state.screen==='dialogue'&&<Dialogue state={state} dispatch={dispatch}/>} {state.screen==='event'&&<StoryEvent state={state} dispatch={dispatch}/>} {state.screen==='result'&&<GrowthReport state={state} dispatch={dispatch}/>} {state.screen==='ending'&&<EndingScreen state={state} dispatch={dispatch}/>}</div>{overlay}</div></main>}
export function useGameState(){const[state,dispatch]=useReducer(reducer,initialState,()=>hydrateSave(localStorage.getItem('puppy-maker-save')));useEffect(()=>localStorage.setItem('puppy-maker-save',serializeGameState(state)),[state]);return{state,dispatch}} export default function App(){const game=useGameState();return <GameApp {...game}/>}
