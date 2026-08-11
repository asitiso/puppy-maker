import type { Action, GameState } from '../game';
import { STORY_EVENTS } from '../game/events';
import { runaPoseAsset } from '../runa-presentation';

export function StoryEvent({state,dispatch}:{state:GameState;dispatch:React.Dispatch<Action>}){
 const event=STORY_EVENTS.find(item=>item.id===state.activeEventId);
 if(!event)return <section className="screen story-event-screen"><p>이번 달의 이야기는 조용히 지나갔어요.</p><button onClick={()=>dispatch({type:'GO',screen:'result'})}>성장 기록 보기</button></section>;
 return <section className="screen story-event-screen"><div className="story-event-glow"/><img className="story-event-runa" src={runaPoseAsset('surprised')} alt="놀란 루나"/><div className="story-event-card"><small>MONTHLY STORY</small><h1>{event.title}</h1><p>{event.body}</p><div className="story-event-choices">{event.choices.map(choice=><button key={choice.id} onClick={()=>dispatch({type:'EVENT_CHOICE',eventId:event.id,choiceId:choice.id})}>{choice.label}</button>)}</div></div></section>;
}
