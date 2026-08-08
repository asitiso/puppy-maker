import type { GameState, Personality, PersonalityKey, Stats } from '../game';

export type StoryEventId='lost_bird'|'moon_flower'|'rival_tracks'|'quiet_rain';
export interface StoryEventChoice { id:string; label:string; statDelta?:Partial<Stats>; personalityDelta?:Partial<Personality>; goldDelta?:number }
export interface StoryEventDefinition { id:StoryEventId; title:string; body:string; choices:StoryEventChoice[]; eligibility:(state:GameState)=>boolean }

const clamp=(value:number)=>Math.max(0,Math.min(100,value));
export const STORY_EVENTS:StoryEventDefinition[]=[
 {id:'lost_bird',title:'숲속의 작은 손님',body:'길가에서 날개를 다친 작은 새가 루나를 바라보고 있어요.',eligibility:state=>state.personality.kindness>=45,choices:[{id:'help',label:'함께 돌봐준다',statDelta:{affection:3,morality:3},personalityDelta:{kindness:3}},{id:'observe',label:'안전한 곳까지 지켜본다',statDelta:{intelligence:2},personalityDelta:{calmness:2}}]},
 {id:'moon_flower',title:'달빛 약초',body:'평소에는 보이지 않던 은빛 약초가 달빛 아래 피어났어요.',eligibility:state=>state.mastery.herb.xp>=1||state.stats.intelligence>=32,choices:[{id:'study',label:'조심스럽게 관찰한다',statDelta:{intelligence:3},personalityDelta:{curiosity:2}},{id:'leave',label:'다음 계절을 위해 남겨둔다',statDelta:{morality:2},personalityDelta:{kindness:2,calmness:1}}]},
 {id:'rival_tracks',title:'낯선 발자국',body:'훈련장 근처에서 강한 마력과 함께 낯선 발자국을 발견했어요.',eligibility:state=>state.personality.courage>=52||state.mastery.hunt.xp>=2,choices:[{id:'follow',label:'루나와 흔적을 따라간다',statDelta:{strength:2},personalityDelta:{courage:3}},{id:'prepare',label:'먼저 준비를 단단히 한다',statDelta:{intelligence:2},personalityDelta:{calmness:2}}]},
 {id:'quiet_rain',title:'비 오는 오후',body:'창밖에 비가 내려요. 오늘만큼은 천천히 시간을 보내도 좋을 것 같아요.',eligibility:state=>state.stats.fatigue>=25||state.stats.stress>=25,choices:[{id:'rest',label:'따뜻하게 함께 쉰다',statDelta:{fatigue:-10,stress:-8,affection:2},personalityDelta:{calmness:2}},{id:'talk',label:'차를 마시며 이야기를 나눈다',statDelta:{stress:-5,affection:4},personalityDelta:{kindness:2}}]},
];

export function eligibleEvents(state:GameState){return STORY_EVENTS.filter(event=>event.eligibility(state)&&!state.eventHistory.includes(event.id));}
export function selectMonthlyEvent(state:GameState){const eligible=eligibleEvents(state);if(!eligible.length)return null;const seed=(state.year*17+state.month*7+state.personality.curiosity+state.personality.courage)%eligible.length;return eligible[seed];}
export function applyEventChoice(state:GameState,eventId:StoryEventId,choiceId:string):GameState{if(state.eventHistory.includes(eventId))return state;const event=STORY_EVENTS.find(item=>item.id===eventId);const choice=event?.choices.find(item=>item.id===choiceId);if(!event||!choice||!event.eligibility(state))return state;const stats={...state.stats};(Object.keys(choice.statDelta??{}) as (keyof Stats)[]).forEach(key=>stats[key]=clamp(stats[key]+(choice.statDelta?.[key]??0)));const personality={...state.personality};(Object.keys(choice.personalityDelta??{}) as PersonalityKey[]).forEach(key=>personality[key]=clamp(personality[key]+(choice.personalityDelta?.[key]??0)));return {...state,stats,personality,gold:Math.max(0,state.gold+(choice.goldDelta??0)),eventHistory:[...state.eventHistory,eventId],activeEventId:undefined};}
