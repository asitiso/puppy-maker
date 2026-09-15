import type {Personality} from '../game-tactical-base';
import type {ExplorationInteractable,ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';
import type {LivingRegionProgress} from './living-region-state';

const outpostAsset=(name:string)=>`/assets/exploration/expedition-outpost/${name}`;
export type ExpeditionOutpostContext={personality:Personality;affection:number;worldFacts:readonly string[];inheritedWorldFacts:readonly string[]};
export type ExpeditionOutpostExploration={world:ExplorationWorldDefinition;storyFrames:Record<string,ExplorationStoryFrame>;discoveryByInteraction:Readonly<Record<string,string>>;questStartInteractionId:string;questResolveInteractionId:string;postResolutionInteractionId:string};
export const expeditionOutpostConditionalEventIds=['courageous-patrol-briefing','bonded-watchfire-response','history-scouting-response'] as const;
const QUEST_START='outpost-captain-briefing';
const QUEST_RESOLVE='outpost-signal-mast';
const POST_RESOLUTION='outpost-watchfire';
const discoveryByInteraction={'outpost-broken-marker':'broken_patrol_marker','outpost-beast-tracks':'ridge_beast_tracks','outpost-supply-seal':'torn_supply_seal'} as const;

export function expeditionOutpostExploration(progress:LivingRegionProgress,context:ExpeditionOutpostContext):ExpeditionOutpostExploration{
  const resolved=progress.phase==='mainQuestResolved'||progress.phase==='postResolution';
  const post=progress.phase==='postResolution';
  const brave=context.personality.courage>=10;
  const bonded=context.affection>=60;
  const experienced=context.worldFacts.length>0||context.inheritedWorldFacts.length>0;
  const storyFrames:Record<string,ExplorationStoryFrame>={
    'outpost-sena':{id:'outpost-sena',eyebrow:'EXPEDITION OUTPOST · COMMAND',title:resolved?'다시 선 경계선':'세나의 경계 명령',speaker:'대장 세나',text:resolved?(bonded?'“루나, 네가 세운 신호 덕분에 모두가 무사히 돌아왔어. 오늘은 손님이 아니라 우리 경계대의 동료야.”':'“신호망이 살아난 뒤 순찰대가 길을 잃지 않아. 전초기지가 다시 제 역할을 하고 있어.”'):(brave?'“겁먹지 않는 눈이군. 북쪽 능선의 순찰 흔적 세 곳을 확인하고 끊긴 신호망을 복구해 줘.”':'“북쪽 능선이 불안정해. 무리하지 말고 순찰 표식과 흔적을 확인한 뒤 바로 보고해 줘.”'),artSrc:outpostAsset('sena.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'세나와 이야기하기',progression:false},
    'outpost-min':{id:'outpost-min',eyebrow:'EXPEDITION OUTPOST · SCOUT',title:'흔적을 읽는 민',speaker:'정찰대원 민',text:experienced?'“여러 지역을 돌아본 사람은 흔적을 다르게 보지. 부러진 표식보다 그 옆에 남은 발자국 방향을 먼저 봐.”':'“순찰 표식이 부러졌다면 주변 흙부터 봐. 발자국이 어디로 향했는지가 더 중요한 단서야.”',artSrc:outpostAsset('min.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'정찰 힌트 듣기',progression:false},
    'outpost-ara':{id:'outpost-ara',eyebrow:'EXPEDITION OUTPOST · SUPPLY',title:resolved?'정돈된 보급선':'흐트러진 보급선',speaker:'보급관 아라',text:resolved?'“신호가 살아나니 보급 시간표도 다시 맞출 수 있게 됐어. 다음 원정은 훨씬 덜 위험할 거야.”':'“신호가 끊기니 보급대가 늦고 순찰대도 제시간에 못 돌아와. 봉인 끈이 찢어진 상자도 확인해 줘.”',artSrc:outpostAsset('ara.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'보급 상황 듣기',progression:false},
    'outpost-briefing':{id:'outpost-briefing',eyebrow:'MAIN QUEST · PATROL PREP',title:'끊긴 경계 신호',speaker:'세나',text:'부러진 순찰 표식, 능선의 낯선 발자국, 찢어진 보급 봉인을 확인하자. 세 단서를 모으면 망가진 신호탑을 안전하게 다시 세울 수 있다.',artSrc:outpostAsset('field-kit.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'순찰 임무 받기',progression:false},
    'outpost-marker':{id:'outpost-marker',eyebrow:'DISCOVERY',title:'부러진 순찰 표식',speaker:'루나',text:'서쪽 경사면의 표식은 바깥쪽에서 안쪽으로 부러져 있다. 바람보다 무언가의 충격이 먼저였던 것 같다.',artSrc:outpostAsset('broken-marker.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'표식 조사',progression:false},
    'outpost-tracks':{id:'outpost-tracks',eyebrow:'DISCOVERY',title:'능선을 가로지른 발자국',speaker:'루나',text:'큰 발자국은 전초기지 쪽이 아니라 북동쪽 골짜기로 향한다. 당장 기지를 덮칠 흔적은 아니지만 순찰 경로를 바꿔야 한다.',artSrc:outpostAsset('tracks.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'발자국 기록',progression:false},
    'outpost-seal':{id:'outpost-seal',eyebrow:'DISCOVERY',title:'찢어진 보급 봉인',speaker:'루나',text:'상자는 비어 있지 않다. 운반 중 걸린 봉인 끈이 찢어져 내용물이 흔들린 흔적이다. 보급로를 좁은 능선에서 옮겨야 한다.',artSrc:outpostAsset('supply-crate.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'보급 상자 확인',progression:false},
    'outpost-repair':{id:'outpost-repair',eyebrow:'MAIN QUEST · COMPLETE',title:'다시 켜진 신호탑',speaker:'세나',text:'세 단서 덕분에 순찰 경로와 보급 동선을 함께 수정했다. 망가진 신호탑에 새 깃발과 등불이 올라가며 전초기지의 경계선이 다시 이어진다.',artSrc:outpostAsset('signal-mast.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'신호망 복구 보고',progression:false},
    'outpost-revisit':{id:'outpost-revisit',eyebrow:'REVISIT · EXPEDITION OUTPOST',title:'밤에도 이어지는 불빛',speaker:'루나',text:post?'보강된 관문 위로 순찰 깃발이 펄럭이고, 감시 불빛은 능선 건너 다음 초소와 이어진다. 전초기지는 이제 단순한 캠프가 아니라 살아 있는 안전망이 됐다.':'새 신호탑 아래에서 정찰대와 보급대가 같은 지도를 보고 있다. 내가 찾은 단서가 실제 순찰 방식까지 바꾸고 있다.',artSrc:outpostAsset('watchfire.svg'),frameSrc:outpostAsset('story-frame.svg'),actionLabel:'달라진 전초기지 보기',progression:false},
  };
  const interactables:ExplorationInteractable[]=[
    {id:'outpost-exit',label:'여행자 교차로로 돌아가기',kind:'exit',position:{x:1180,y:1510},radius:115},
    {id:'outpost-npc-sena',label:resolved?'세나와 다시 이야기하기':'대장 세나에게 보고하기',kind:'story',position:{x:760,y:1180},radius:120,storyFrameId:'outpost-sena',artSrc:outpostAsset('sena.svg'),repeatable:true},
    {id:'outpost-npc-min',label:'정찰대원 민에게 흔적 묻기',kind:'story',position:{x:1750,y:1040},radius:120,storyFrameId:'outpost-min',artSrc:outpostAsset('min.svg'),repeatable:true},
    {id:'outpost-npc-ara',label:'보급관 아라와 이야기하기',kind:'story',position:{x:560,y:470},radius:120,storyFrameId:'outpost-ara',artSrc:outpostAsset('ara.svg'),repeatable:true},
  ];
  if(resolved){
    interactables.push({id:POST_RESOLUTION,label:'복구된 감시 불빛 살펴보기',kind:'story',position:{x:1320,y:350},radius:145,storyFrameId:'outpost-revisit',artSrc:outpostAsset('watchfire.svg'),repeatable:true});
  }else{
    interactables.push(
      {id:QUEST_START,label:'세나의 순찰 브리핑 듣기',kind:'story',position:{x:900,y:1120},radius:130,storyFrameId:'outpost-briefing',artSrc:outpostAsset('field-kit.svg')},
      {id:'outpost-broken-marker',label:'서쪽 경사면 순찰 표식 조사',kind:'story',position:{x:340,y:760},radius:125,storyFrameId:'outpost-marker',artSrc:outpostAsset('broken-marker.svg'),requiresCompleted:[QUEST_START]},
      {id:'outpost-beast-tracks',label:'북동 능선 발자국 기록',kind:'story',position:{x:1940,y:520},radius:135,storyFrameId:'outpost-tracks',artSrc:outpostAsset('tracks.svg'),requiresCompleted:[QUEST_START]},
      {id:'outpost-supply-seal',label:'보급 상자의 찢어진 봉인 확인',kind:'story',position:{x:1520,y:1210},radius:125,storyFrameId:'outpost-seal',artSrc:outpostAsset('supply-crate.svg'),requiresCompleted:['outpost-broken-marker','outpost-beast-tracks']},
      {id:QUEST_RESOLVE,label:'신호탑 복구 계획 확정하기',kind:'story',position:{x:1290,y:430},radius:145,storyFrameId:'outpost-repair',artSrc:outpostAsset('signal-mast.svg'),requiresCompleted:['outpost-broken-marker','outpost-beast-tracks','outpost-supply-seal']},
    );
  }
  return {world:{id:'expedition-outpost',label:'원정 전초기지',objective:resolved?(post?'보강된 관문과 순찰대의 새로운 일상을 다시 확인하세요.':'복구된 신호망과 바뀐 순찰 동선을 살펴보세요.'):(progress.phase==='mainQuestInProgress'?'순찰 표식, 능선 발자국, 보급 봉인을 확인하고 신호탑으로 돌아가세요.':'세나의 브리핑을 듣고 불안정한 전초기지 경계를 조사하세요.'),width:2400,height:1600,playerRadius:22,playerSpeed:238,start:{x:1180,y:1400},layers:[{id:'ground',src:outpostAsset('outpost-ground.svg'),zIndex:0},{id:'camp',src:outpostAsset('camp-layout.svg'),zIndex:2},...(resolved?[{id:'repaired-signal',src:outpostAsset('repaired-signal.svg'),zIndex:5}]:[])],obstacles:[{id:'west-palisade',x:80,y:240,width:250,height:720},{id:'east-palisade',x:2080,y:220,width:240,height:760},{id:'north-ridge',x:500,y:70,width:1400,height:190},{id:'command-tent',x:610,y:960,width:420,height:250},{id:'supply-tent',x:390,y:300,width:380,height:260},{id:'central-barricade',x:1030,y:690,width:360,height:170},{id:'east-watch',x:1650,y:840,width:360,height:190},{id:'signal-base',x:1160,y:260,width:280,height:210}],interactables},storyFrames,discoveryByInteraction,questStartInteractionId:QUEST_START,questResolveInteractionId:QUEST_RESOLVE,postResolutionInteractionId:POST_RESOLUTION};
}
