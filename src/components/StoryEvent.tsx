import { useState } from 'react';
import type { Action, GameState } from '../game';
import { STORY_EVENTS, type StoryEventId } from '../game/events';
import { runaPoseAsset } from '../runa-presentation';
import '../story-dialogue-stage.css';

type StoryGuest = {name:string;icon:string;line:string};

const STORY_GUESTS:Record<StoryEventId,StoryGuest>={
  lost_bird:{name:'고양이',icon:'🐱',line:'작은 친구가 무서워하지 않게 천천히 다가가자.'},
  moon_flower:{name:'올빼미',icon:'🦉',line:'달빛이 가장 밝을 때만 드러나는 흔적이야. 잘 살펴보자.'},
  rival_tracks:{name:'늑대',icon:'🐺',line:'강한 기척이야. 서두르지 말고 흔적부터 읽어 보자.'},
  quiet_rain:{name:'곰',icon:'🐻',line:'오늘은 잠깐 쉬어도 괜찮아. 따뜻한 곳에서 이야기하자.'},
  starlight_market:{name:'고양이',icon:'🐱',line:'반짝이는 게 정말 많네! 그래도 가장 마음에 드는 하나를 골라 보자.'},
  old_shrine:{name:'올빼미',icon:'🦉',line:'이 빛은 오래된 약속에 반응하고 있어. 조용히 귀 기울여 봐.'},
  firefly_path:{name:'늑대',icon:'🐺',line:'불빛이 길처럼 이어져 있어. 내가 옆에서 발맞출게.'},
  training_bell:{name:'곰',icon:'🐻',line:'새벽 훈련이라면 몸부터 충분히 풀고 시작하자.'},
  winter_letter:{name:'고양이',icon:'🐱',line:'누가 보냈을까? 지금까지의 루나를 오래 지켜본 것 같아.'},
  guardian_dream:{name:'올빼미',icon:'🦉',line:'지나온 길도 아직 열리지 않은 길도 모두 루나의 선택이 될 거야.'},
};

export function StoryEvent({state,dispatch}:{state:GameState;dispatch:React.Dispatch<Action>}){
 const event=STORY_EVENTS.find(item=>item.id===state.activeEventId);
 const [speaker,setSpeaker]=useState<0|1>(0);
 if(!event)return <section className="screen story-event-screen"><p>이번 달의 이야기는 조용히 지나갔어요.</p><button onClick={()=>dispatch({type:'GO',screen:'result'})}>성장 기록 보기</button></section>;
 const guest=STORY_GUESTS[event.id];
 const speakerName=speaker===0?'루나':guest.name;
 const speakerLine=speaker===0?event.body:guest.line;
 return <section className="screen story-event-screen" aria-label={`${event.title} 이야기`}>
   <div className="story-event-glow"/>
   <div className="story-dialogue-stage" aria-label="캐릭터 대화 무대">
     <figure className={`story-character story-character--left ${speaker===0?'is-speaking':''}`} aria-label="루나">
       <img className="story-character__runa" src={runaPoseAsset('surprised')} alt="놀란 루나"/>
       <figcaption className="story-character__name">루나</figcaption>
     </figure>
     <figure className={`story-character story-character--right ${speaker===1?'is-speaking':''}`} aria-label={guest.name}>
       <div className="story-character__guest" aria-hidden="true"><span>{guest.icon}</span><small>{guest.name}</small></div>
       <figcaption className="story-character__name">{guest.name}</figcaption>
     </figure>
   </div>
   <div className="story-dialogue-panel">
     <div className="story-dialogue-body">
       <header><small>MONTHLY STORY</small><strong>{speakerName}</strong></header>
       <h1>{event.title}</h1>
       <p>{event.body}</p>
       <div className="story-dialogue-turn" role="status" aria-live="polite"><strong>{speakerName}</strong><span>{speakerLine}</span></div>
       <button type="button" className="story-dialogue-advance" onClick={()=>setSpeaker(current=>current===0?1:0)}>{speaker===0?`${guest.name}의 말 듣기`:'루나의 말 보기'}</button>
     </div>
     <div className="story-event-choices">{event.choices.map(choice=><button key={choice.id} onClick={()=>dispatch({type:'EVENT_CHOICE',eventId:event.id,choiceId:choice.id})}>{choice.label}</button>)}</div>
   </div>
 </section>;
}
