import type { GameState } from './game';
import { MEMORY_CATALOG } from './game/memories';
import { STORY_EVENTS } from './game/events';
import { endingScores, type EndingId } from './game/endings';
import { masteryLevel } from './game';
export type HomeMenuId='schedule'|'bag'|'quest'|'outing'|'bond'|'attendance'|'event'|'mail'|'mission';
export type HomePanelItem={title:string;detail?:string;state?:'done'|'active'|'locked'};
export type HomePanel={title:string;eyebrow:string;summary:string;items:HomePanelItem[]};
const endingNames:Record<EndingId,string>={guardian:'별빛의 수호자',sage:'달빛의 현자',healer:'숲의 치유사',explorer:'바람의 탐험가',companion:'영원한 동반자',balanced:'조화의 수호령'};
const activityNames={hunt:'사냥',magic:'마법',rest:'휴식',herb:'약초'} as const;
const condition=(state:GameState)=>state.condition==='tired'?'피곤':state.condition==='focused'?'집중':state.condition==='energetic'?'활기참':'평온';
export function getHomePanel(id:HomeMenuId,state:GameState):HomePanel|null{
 const mastery=Object.entries(state.mastery).map(([key,value])=>({title:`${activityNames[key as keyof typeof activityNames]} 숙련 Lv.${masteryLevel(value.xp)}`,detail:`${value.xp} XP`,state:'active' as const}));
 const memories=state.memories.length?state.memories.slice().reverse().map(memory=>({title:MEMORY_CATALOG[memory.id].title,detail:`${memory.year}년 ${memory.month}월 · ${MEMORY_CATALOG[memory.id].description}`,state:'done' as const})):[{title:'아직 기록된 기억이 없어요',detail:'훈련과 교감으로 첫 추억을 만들어보세요.',state:'locked' as const}];
 const events=STORY_EVENTS.map(event=>({title:event.title,detail:state.eventHistory.includes(event.id)?'함께 경험한 이야기':'아직 만나지 못한 이야기',state:state.eventHistory.includes(event.id)?'done' as const:'locked' as const}));
 const endings=(Object.keys(endingNames) as EndingId[]).map(id=>({title:state.endingCollection.includes(id)?endingNames[id]:'???',detail:state.endingCollection.includes(id)?'엔딩 도감에 기록됨':'새로운 육성에서 발견할 수 있어요',state:state.endingCollection.includes(id)?'done' as const:'locked' as const}));
 const scores=endingScores(state),leading=(Object.keys(scores) as EndingId[]).sort((a,b)=>scores[b]-scores[a])[0];
 const panels:Partial<Record<HomeMenuId,HomePanel>>={
  bag:{title:'성장 기록',eyebrow:'RUNA STATUS',summary:`현재 컨디션 ${condition(state)} · ${state.monthsCompleted}/12개월`,items:mastery},
  quest:{title:'육성 목표',eyebrow:'RAISING GOALS',summary:'다음 성장을 위한 장기 목표',items:[{title:'12개월 함께하기',detail:`${state.monthsCompleted}/12개월`,state:state.monthsCompleted>=12?'done':'active'},{title:'기억 도감 채우기',detail:`${state.memories.length}/${Object.keys(MEMORY_CATALOG).length}`,state:state.memories.length===Object.keys(MEMORY_CATALOG).length?'done':'active'},{title:'이야기 만나기',detail:`${state.eventHistory.length}/${STORY_EVENTS.length}`,state:state.eventHistory.length===STORY_EVENTS.length?'done':'active'}]},
  outing:{title:'엔딩의 별자리',eyebrow:'DESTINY',summary:`현재 가장 가까운 미래 · ${endingNames[leading]}`,items:endings},
  attendance:{title:'함께한 시간',eyebrow:'JOURNEY',summary:`루나와 ${state.monthsCompleted}개월째 성장 중`,items:[{title:`${state.year}년 ${state.month}월`,detail:`${state.week}주차 · ${condition(state)}`,state:'active'},{title:'성장 이정표',detail:`${state.claimedMilestones.length}/4 달성`,state:state.claimedMilestones.length===4?'done':'active'}]},
  event:{title:'이야기 도감',eyebrow:'STORY ARCHIVE',summary:`발견 ${state.eventHistory.length}/${STORY_EVENTS.length}`,items:events},
  mail:{title:'추억 앨범',eyebrow:'MEMORIES',summary:`소중한 기억 ${state.memories.length}개`,items:memories},
  mission:{title:'이번 달 가이드',eyebrow:'NEXT STEPS',summary:'지금 루나에게 가장 필요한 행동',items:[{title:'4주 일정을 완성하기',detail:'훈련과 휴식을 균형 있게 배치',state:'active'},{title:'루나의 컨디션 살피기',detail:`현재 ${condition(state)} · 피로 ${state.stats.fatigue}`,state:state.stats.fatigue<70?'done':'active'},{title:'새로운 기억 만들기',detail:`현재 ${state.memories.length}개 발견`,state:'active'}]}
 };return panels[id]??null;
}
