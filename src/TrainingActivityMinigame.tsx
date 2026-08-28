import {useEffect,useMemo,useState} from 'react';
import type {ActivityId} from './game';
import SceneStage from './scene/SceneStage';
import {primaryTrainingInteraction,trainingSceneForActivity} from './scene/training-scenes';
import {buildTrainingActivityQueue,challengeForRound,herbOrderForRound,magicPatternForRound,type HerbToken,type MagicRune,type TrainingActionKind,type TrainingPresentationGrade} from './training-minigames';
import './training-minigames.css';

type Props={
  schedule:readonly ActivityId[];
  year:number;
  month:number;
  week:number;
  score:number;
  combo:number;
  onTrain:(kind:TrainingActionKind,accuracy:number)=>void;
  onFinish:()=>void;
};

const activityLabels={hunt:'사냥 훈련',magic:'마법 수업',herb:'약초 채집'} as const;
const huntActions:readonly {id:TrainingActionKind;label:string;symbol:string}[]=[
  {id:'attack',label:'공격',symbol:'⚔'},
  {id:'dodge',label:'회피',symbol:'◒'},
  {id:'charge',label:'기 모으기',symbol:'✦'},
];
const herbClues:Record<HerbToken,readonly string[]>={
  '반짝잎':['빛을 받으면 은빛 점이 반짝이는 잎','푸른 잎 위 작은 은빛 점이 각도에 따라 흐려져요','그늘에서는 평범하지만 잎을 돌리면 작은 점이 잠깐 빛나요'],
  '달빛풀':['끝이 초승달처럼 휘어진 푸른 잎','푸른 잎 끝이 한쪽으로 부드럽게 휘어져요','별무늬 없이 매끈하고 끝선만 초승달처럼 기울어요'],
  '별이끼':['표면에 작은 별무늬가 퍼진 이끼','낮게 퍼진 초록 표면에 각진 무늬가 숨어 있어요','은빛 점보다 작고 각진 무늬가 촘촘히 이어져요'],
};
const magicButtons:readonly MagicRune[]=['✦','◇','✧','○'];

function gradeForAccuracy(accuracy:number):TrainingPresentationGrade{
  if(accuracy>=.8)return 'clean';
  if(accuracy>=.55)return 'good';
  return 'recovered';
}

export default function TrainingActivityMinigame({schedule,year,month,week,score,combo,onTrain,onFinish}:Props){
  const queue=useMemo(()=>buildTrainingActivityQueue(schedule),[schedule]);
  const [stageIndex,setStageIndex]=useState(0);
  const [round,setRound]=useState(0);
  const [sceneReady,setSceneReady]=useState(false);
  const [needle,setNeedle]=useState(.08);
  const [feedback,setFeedback]=useState('');
  const [presentationGrade,setPresentationGrade]=useState<TrainingPresentationGrade>('clean');
  const [magicInput,setMagicInput]=useState<MagicRune[]>([]);
  const [magicMistakes,setMagicMistakes]=useState(0);
  const [showMagicPattern,setShowMagicPattern]=useState(true);
  const seed=year*10000+month*100+week;
  const activity=queue[stageIndex];
  const complete=stageIndex>=queue.length;

  useEffect(()=>{setSceneReady(false);setFeedback('');},[stageIndex]);

  useEffect(()=>{
    if(!sceneReady||activity!=='hunt')return;
    const challenge=challengeForRound('hunt',seed,round);
    const speed=.022+challenge.difficulty*.025;
    const id=window.setInterval(()=>setNeedle(value=>(value+speed)%1),32);
    return ()=>window.clearInterval(id);
  },[activity,round,sceneReady,seed]);

  useEffect(()=>{
    setMagicInput([]);
    setMagicMistakes(0);
    if(!sceneReady||activity!=='magic')return;
    setShowMagicPattern(true);
    const previewMs=challengeForRound('magic',seed,round).previewMs;
    const id=window.setTimeout(()=>setShowMagicPattern(false),previewMs);
    return ()=>window.clearTimeout(id);
  },[activity,round,sceneReady,seed]);

  const advanceRound=(kind:TrainingActionKind,accuracy:number,message:string)=>{
    const safeAccuracy=Math.max(0,Math.min(1,accuracy));
    onTrain(kind,safeAccuracy);
    setPresentationGrade(gradeForAccuracy(safeAccuracy));
    setFeedback(message);
    window.setTimeout(()=>setFeedback(''),450);
    if(round>=2){setRound(0);setStageIndex(index=>index+1);}else setRound(value=>value+1);
  };

  if(complete){
    return <section className="screen training-screen training-minigame is-complete" aria-label="이번 주 실습 완료">
      <div className="training-minigame__backdrop"/>
      <div className="training-minigame__complete-card">
        <small>WEEKLY PRACTICE COMPLETE</small><h2>{queue.length?`${queue.length}개 실습 완료`:'회복 일정 완료'}</h2>
        <p>{queue.length?'사냥·마법·채집 실습을 마쳤어요. 최종 성장 판정은 기존 훈련 규칙이 처리합니다.':'이번 일정은 휴식 중심이에요. 결과를 확인해 주세요.'}</p>
        <button type="button" onClick={onFinish}>결과 확인</button>
      </div>
    </section>;
  }

  if(!sceneReady){
    const scene=trainingSceneForActivity(activity,{year,month,week});
    const primary=primaryTrainingInteraction(activity);
    const primaryLabel=scene.interactions.find(item=>item.id===primary)?.label??'훈련 시작';
    return <section className="screen training-screen training-scene-entry" aria-label={`${activityLabels[activity]} 장소`}>
      <SceneStage scene={scene} onInteraction={interaction=>{
        if(interaction.id===primary){setSceneReady(true);setFeedback('');}
        else setFeedback(`${primaryLabel}을 선택하면 실습을 시작해요.`);
      }}/>
      <div className="training-scene-entry__guide" aria-live="polite"><small>SCENE PRACTICE · {stageIndex+1}/{queue.length}</small><strong>{activityLabels[activity]}</strong><span>{feedback||`루나를 ${primaryLabel} 위치로 이동시켜 실습을 시작하세요.`}</span></div>
    </section>;
  }

  const challenge=challengeForRound(activity,seed,round);
  const progress=`${stageIndex+1}/${queue.length} · ${round+1}/3`;
  const challengeMeta=`난이도 ${Math.round(challenge.difficulty*100)} · FLOW ${presentationGrade.toUpperCase()}`;

  if(activity==='hunt'){
    const targetCenter=[.24,.63,.43][round];
    const expected=huntActions[(seed+round)%huntActions.length];
    const timingAccuracy=Math.max(0,1-Math.abs(targetCenter-needle)/challenge.timingWindow);
    return <section className="screen training-screen training-minigame is-hunt" aria-label="사냥 훈련 미니게임">
      <div className="training-minigame__backdrop"/>
      <header className="training-minigame__hud"><div><small>사냥 훈련</small><b>{progress}</b></div><div><small>COMBO</small><b>{combo}</b></div><div><small>SCORE</small><b>{score}</b></div></header>
      <div className="hunt-challenge"><small>{challengeMeta}</small><p>신호에 맞는 행동을 정확한 타이밍에!</p><strong>{expected.label}</strong><div className="hunt-meter"><span className="hunt-zone" style={{left:`${targetCenter*100}%`,width:`${challenge.timingWindow*200}%`}}/><i style={{left:`${needle*100}%`}}/></div>{feedback?<em>{feedback}</em>:null}</div>
      <div className="training-choice-row">{huntActions.map(action=><button key={action.id} type="button" onClick={()=>{
        const accuracy=timingAccuracy*(action.id===expected.id?1:.46);
        advanceRound(action.id,accuracy,action.id===expected.id&&accuracy>.8?'PERFECT!':action.id===expected.id?'GOOD!':'WRONG MOVE');
      }}><span>{action.symbol}</span><b>{action.label}</b></button>)}</div>
    </section>;
  }

  if(activity==='magic'){
    const pattern=magicPatternForRound(seed,round);
    const pushRune=(rune:MagicRune)=>{
      const nextIndex=magicInput.length;
      if(pattern[nextIndex]!==rune){setMagicInput([]);setMagicMistakes(value=>value+1);setPresentationGrade('recovered');setFeedback('주문 흐름이 끊겼어요 · 처음부터 다시');return;}
      const next=[...magicInput,rune];
      if(next.length===pattern.length){advanceRound('charge',Math.max(.35,1-magicMistakes*.18),'SPELL COMPLETE');setMagicInput([]);return;}
      setMagicInput(next);
    };
    return <section className="screen training-screen training-minigame is-magic" aria-label="마법 수업 미니게임">
      <div className="training-minigame__backdrop"/>
      <header className="training-minigame__hud"><div><small>마법 수업</small><b>{progress}</b></div><div><small>연속 입력</small><b>{magicInput.length}/{pattern.length}</b></div><div><small>SCORE</small><b>{score}</b></div></header>
      <div className="magic-challenge"><small>RUNE MEMORY · {challengeMeta}</small><h2>{showMagicPattern?`${pattern.length}개의 룬 순서를 기억하세요`:'같은 순서로 룬을 입력하세요'}</h2><div className="magic-pattern" aria-live="polite">{showMagicPattern?pattern.join('  '):magicInput.map(()=> '●').join(' ')||'· · ·'}</div>{feedback?<p>{feedback}</p>:null}</div>
      <div className="magic-rune-grid">{magicButtons.map(rune=><button key={rune} type="button" disabled={showMagicPattern} onClick={()=>pushRune(rune)} aria-label={`룬 ${rune}`}>{rune}</button>)}</div>
    </section>;
  }

  const order=herbOrderForRound(seed,round);
  const target=order[round%order.length];
  const options=herbOrderForRound(seed+2,round);
  const clue=herbClues[target][Math.min(round,herbClues[target].length-1)];
  return <section className="screen training-screen training-minigame is-herb" aria-label="약초 채집 미니게임">
    <div className="training-minigame__backdrop"/>
    <header className="training-minigame__hud"><div><small>약초 채집</small><b>{progress}</b></div><div><small>유사 단서</small><b>{Math.round(challenge.distractorCloseness*100)}</b></div><div><small>SCORE</small><b>{score}</b></div></header>
    <div className="herb-challenge"><small>FIELD NOTE · {challengeMeta}</small><h2>{round<2?'설명에 맞는 약초를 고르세요':'핵심 특징만 보고 약초를 구별하세요'}</h2><p>{clue}</p>{feedback?<em>{feedback}</em>:null}</div>
    <div className="herb-choice-grid">{options.map(herb=><button key={herb} type="button" onClick={()=>advanceRound('dodge',herb===target?1:.42,herb===target?'정확한 채집!':'비슷하지만 다른 약초예요')}><span aria-hidden="true">❧</span><b>{herb}</b></button>)}</div>
  </section>;
}
