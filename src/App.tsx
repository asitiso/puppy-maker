import { useEffect, useMemo, useReducer, useState } from 'react';
import { activities, initialState, reducer, trainingGrade, type ActivityId } from './game';

const iconPaths: Record<string, string> = {
  sword: 'M6 19l4-4m0 0 7-7 2-4-4 2-7 7m2 2 3 3m-7-1 3 3',
  spark: 'M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z',
  moon: 'M18 16.8A8 8 0 118.2 5a6.5 6.5 0 009.8 11.8z',
  leaf: 'M5 19c7 0 12-5 14-14C10 6 5 11 5 19zm0 0c3-4 6-7 10-9',
  calendar: 'M5 5h14v14H5zM8 3v4m8-4v4M5 9h14',
  bag: 'M7 8h10l1 11H6L7 8zm3 0V6a2 2 0 014 0v2',
  quest: 'M6 4h12v16H6zM9 8h6m-6 4h6m-6 4h4',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',
  heart: 'M12 20S4 15 4 9a4 4 0 017-2 4 4 0 017 2c0 6-6 11-6 11z'
};

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

function Pet({ mood = 'happy' }: { mood?: 'happy' | 'focus' | 'shy' }) {
  return (
    <div className={`pet pet-${mood}`} aria-label="수호 여우 루나">
      <div className="pet-aura" />
      <svg viewBox="0 0 360 480" role="img">
        <defs>
          <linearGradient id="fur" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff6ef"/><stop offset=".58" stopColor="#ffc7a8"/><stop offset="1" stopColor="#ee8290"/></linearGradient>
          <linearGradient id="tail" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd3b1"/><stop offset="1" stopColor="#df7186"/></linearGradient>
          <radialGradient id="eye"><stop stopColor="#fff6bd"/><stop offset=".38" stopColor="#8eeaff"/><stop offset="1" stopColor="#38639f"/></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path className="tail" d="M270 289c81 44 61 145-25 141 46-27 35-66-4-83z" fill="url(#tail)"/>
        <path d="M89 135L68 28l88 67M270 135l22-107-88 67" fill="url(#fur)" stroke="#d67485" strokeWidth="7"/>
        <path d="M88 112L78 53l51 48m143 11 10-59-51 48" fill="#b45175" opacity=".78"/>
        <ellipse cx="180" cy="211" rx="117" ry="130" fill="url(#fur)" stroke="#d9798b" strokeWidth="7"/>
        <path d="M105 223c21 72 129 84 154 0-9 105-36 165-79 165s-70-60-75-165z" fill="#fff5ec" opacity=".94"/>
        <ellipse cx="132" cy="190" rx="30" ry="39" fill="#fff"/><ellipse cx="228" cy="190" rx="30" ry="39" fill="#fff"/>
        <ellipse cx="137" cy="195" rx="18" ry="27" fill="url(#eye)"/><ellipse cx="223" cy="195" rx="18" ry="27" fill="url(#eye)"/>
        <ellipse cx="141" cy="188" rx="6" ry="10" fill="#fff"/><ellipse cx="227" cy="188" rx="6" ry="10" fill="#fff"/>
        <path d="M163 235q17 17 34 0-17-11-34 0z" fill="#9d4d69"/>
        <path className="pet-mouth" d="M180 248c-8 13-22 14-30 3m30-3c8 13 22 14 30 3" fill="none" stroke="#8e4960" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="106" cy="231" r="16" fill="#ff8fa1" opacity=".35"/><circle cx="254" cy="231" r="16" fill="#ff8fa1" opacity=".35"/>
        <path d="M134 311c-36 30-47 91-22 118 17 18 42 2 46-28m68-90c36 30 47 91 22 118-17 18-42 2-46-28" fill="url(#fur)" stroke="#d9798b" strokeWidth="7"/>
        <path d="M135 302q45 31 90 0l13 74q-58 38-116 0z" fill="#6174bc" stroke="#ffd98a" strokeWidth="7"/>
        <path d="M180 306l18 35-18 43-18-43z" fill="#89f5ff" filter="url(#glow)"/>
      </svg>
    </div>
  );
}

function Hud({ state }: { state: typeof initialState }) {
  return <header className="top-hud">
    <div className="profile-medallion"><span>Lv.10</span><b>루나</b></div>
    <div className="calendar-pill"><small>{state.year}년차</small><strong>{state.month}월 {state.week}주차</strong><em>맑음</em></div>
    <div className="currencies"><span className="currency gold">◈ {state.gold.toLocaleString()}</span><span className="currency gem">◆ {state.gems}</span></div>
  </header>;
}

function Hub({ state, go }: { state: typeof initialState; go: (s: 'schedule') => void }) {
  const [petted, setPetted] = useState(false);
  return <section className="screen hub-screen">
    <div className="cabin-backdrop"><div className="window-light"/><div className="fireplace"><i/><i/><i/></div><div className="shelf"/><div className="sparkles"/></div>
    <Hud state={state}/>
    <div className="side-stats">
      {([['체력', state.stats.strength], ['마력', state.stats.magic], ['호감', state.stats.affection], ['피로', state.stats.fatigue]] as const).map(([label, value]) => <div key={label}><span>{label}</span><b><i style={{ width: `${value}%` }}/></b></div>)}
    </div>
    <button className="pet-stage" onClick={() => setPetted(true)} aria-label="루나 쓰다듬기"><Pet mood={petted ? 'shy' : 'happy'}/>{petted && <span className="heart-pop">♥</span>}</button>
    <div className="speech">{petted ? '헤헤… 주인님의 손은 따뜻해요!' : '오늘은 어떤 모험을 시작할까요?'}</div>
    <nav className="bottom-nav">
      {[
        ['calendar','스케줄',() => go('schedule')], ['bag','가방',() => undefined], ['quest','퀘스트',() => undefined], ['map','외출',() => undefined], ['heart','교감',() => setPetted(true)]
      ].map(([icon,label,fn]) => <button key={label as string} onClick={fn as () => void}><span><Icon name={icon as string}/></span><b>{label as string}</b></button>)}
    </nav>
  </section>;
}

function Schedule({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const ids = Object.keys(activities) as ActivityId[];
  return <section className="screen diary-screen">
    <div className="diary-bg"/>
    <div className="screen-title"><small>MONTHLY PLAN</small><h1>{state.month}월 성장 다이어리</h1></div>
    <div className="book">
      <div className="book-ring"/>
      <div className="week-list">
        {state.schedule.map((id, index) => <div className="week-row" key={index}><span className="week-label">{index + 1}<small>WEEK</small></span><div className={`activity-card activity-${id}`}><span><Icon name={activities[id].icon}/></span><div><b>{activities[id].name}</b><small>{id === 'rest' ? '피로와 스트레스 회복' : id === 'herb' ? '골드와 지식 획득' : '핵심 능력치 성장'}</small></div></div><button className="cycle" onClick={() => dispatch({ type:'SET_SCHEDULE', index, activity: ids[(ids.indexOf(id)+1)%ids.length] })}>↻</button></div>)}
      </div>
      <div className="activity-palette">{ids.map(id => <button key={id} onClick={() => dispatch({ type:'SET_SCHEDULE', index: 0, activity:id })}><Icon name={activities[id].icon}/><span>{activities[id].name}</span></button>)}</div>
    </div>
    <Pet mood="focus"/>
    <div className="planner-actions"><button className="secondary" onClick={() => dispatch({type:'AUTO_SCHEDULE'})}>자동 배치</button><button className="primary" onClick={() => dispatch({type:'GO',screen:'training'})}>일정 시작</button></div>
  </section>;
}

function Training({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const [needle, setNeedle] = useState(0.1);
  const [flash, setFlash] = useState('');
  useEffect(() => { const id = setInterval(() => setNeedle(v => (v + .037) % 1), 40); return () => clearInterval(id); }, []);
  const accuracy = useMemo(() => 1 - Math.min(1, Math.abs(.5 - needle) * 2), [needle]);
  const hit = (kind: 'attack'|'dodge'|'charge') => { dispatch({type:'TRAIN',kind,accuracy}); setFlash(accuracy > .7 ? 'PERFECT!' : accuracy > .45 ? 'GOOD!' : 'MISS'); setTimeout(() => setFlash(''), 500); };
  return <section className="screen training-screen">
    <div className="forest-arena"><div className="moon-orb"/><div className="trees"/><div className="mist"/></div>
    <div className="battle-hud"><div><small>COMBO</small><b>{state.combo}</b></div><div className="score"><span>SCORE</span><b>{state.trainingScore}</b></div><button onClick={() => dispatch({type:'FINISH_TRAINING'})}>훈련 종료</button></div>
    <div className="dummy"><span/><i/><b/></div>
    <div className="fighter"><Pet mood="focus"/></div>
    <div className="timing-ring"><div className="sweet-spot"/><i style={{transform:`rotate(${needle*360}deg)`}}/><span>{flash}</span></div>
    <div className="action-bar"><button className="attack" onClick={() => hit('attack')}><Icon name="sword"/><b>공격</b></button><button className="dodge" onClick={() => hit('dodge')}><span>◒</span><b>회피</b></button><button className="charge" onClick={() => hit('charge')}><Icon name="spark"/><b>기 모으기</b></button></div>
  </section>;
}

function Dialogue({ dispatch }: { dispatch: React.Dispatch<any> }) {
  return <section className="screen dialogue-screen"><div className="story-forest"/><div className="story-pet"><Pet mood="shy"/></div><div className="dialogue-box"><div className="nameplate">RUNA · 루나</div><p>오늘 사냥 수업, 정말 재미있었어요!<br/>주인님과 함께라면 뭐든 할 수 있을 것 같아요.</p><div className="choices"><button onClick={() => dispatch({type:'CHOOSE',choice:'hug'})}>따뜻하게 안아준다 <small>호감도 ↑ 스트레스 ↓</small></button><button onClick={() => dispatch({type:'CHOOSE',choice:'scold'})}>조금 더 엄하게 지도한다 <small>도덕성 ↑</small></button><button onClick={() => dispatch({type:'CHOOSE',choice:'snack'})}>별빛 간식을 건넨다 <small>100G · 스트레스 크게 ↓</small></button></div></div></section>;
}

function Result({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const grade = trainingGrade(state.trainingScore);
  return <section className="screen result-screen"><div className="result-rays"/><div className={`grade grade-${grade}`}>{grade}</div><h1>{state.month}월 성장 기록</h1><p>루나는 이번 달에도 한 뼘 더 성장했어요.</p><div className="result-card"><div><span>근력</span><b>{state.stats.strength}</b></div><div><span>마력</span><b>{state.stats.magic}</b></div><div><span>호감도</span><b>{state.stats.affection}</b></div><div><span>스트레스</span><b>{state.stats.stress}</b></div></div><div className="reward"><span>월간 보상</span><b>350 G</b></div><button className="primary next-month" onClick={() => dispatch({type:'NEXT_MONTH'})}>다음 달 시작</button></section>;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, init => {
    try { return JSON.parse(localStorage.getItem('puppy-maker-save') || '') || init; } catch { return init; }
  });
  useEffect(() => localStorage.setItem('puppy-maker-save', JSON.stringify(state)), [state]);
  return <main className="page"><div className="game-shell"><div className="ornate-corners"><i/><i/><i/><i/></div>{state.screen === 'hub' && <Hub state={state} go={() => dispatch({type:'GO',screen:'schedule'})}/>} {state.screen === 'schedule' && <Schedule state={state} dispatch={dispatch}/>} {state.screen === 'training' && <Training state={state} dispatch={dispatch}/>} {state.screen === 'dialogue' && <Dialogue dispatch={dispatch}/>} {state.screen === 'result' && <Result state={state} dispatch={dispatch}/>}</div></main>;
}