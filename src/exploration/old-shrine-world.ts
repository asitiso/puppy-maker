import type {Personality} from '../game-tactical-base';
import type {ExplorationInteractable,ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';
import type {LivingRegionProgress} from './living-region-state';

const shrineAsset=(name:string)=>`/assets/exploration/old-shrine/${name}`;

export type OldShrineContext={
  personality:Personality;
  affection:number;
  worldFacts:readonly string[];
  inheritedWorldFacts:readonly string[];
};

export type OldShrineExploration={
  world:ExplorationWorldDefinition;
  storyFrames:Record<string,ExplorationStoryFrame>;
  discoveryByInteraction:Readonly<Record<string,string>>;
  questStartInteractionId:string;
  questResolveInteractionId:string;
  postResolutionInteractionId:string;
};

const QUEST_START='shrine-sealed-arch';
const QUEST_RESOLVE='shrine-rune-core';
const POST_RESOLUTION='shrine-open-sanctum';

const discoveryByInteraction={
  'shrine-moon-inscription':'moon_inscription',
  'shrine-rune-device':'rune_pattern',
  'shrine-memory-shard':'memory_shard',
} as const;

function sensitiveFrames(context:OldShrineContext,resolved:boolean):Record<string,ExplorationStoryFrame>{
  const curious=context.personality.curiosity>=10;
  const bonded=context.affection>=55;
  const inherited=context.inheritedWorldFacts.length>0||context.worldFacts.some(fact=>fact.includes('guardian')||fact.includes('shrine'));
  const keeperText=resolved
    ? bonded
      ? '신전의 빛이 루나의 발걸음을 기억한다. 문지기 에코는 둘이 함께 돌아온 것을 알아보고 조용히 고개를 숙인다.'
      : '봉인이 풀린 뒤 돌계단 사이로 잔잔한 빛이 흐른다. 문지기 에코는 다시 찾아온 탐험자를 오래된 친구처럼 맞는다.'
    : '반쯤 무너진 기둥 아래 희미한 문지기 에코가 나타난다. “세 개의 기억을 잇는 자만 잠든 문을 깨울 수 있다.”';
  const childText=curious
    ? '어린 에코가 웃으며 속삭인다. “궁금한 걸 그냥 지나치지 않는구나. 달빛 글자는 돌이 아니라 그림자 사이를 읽어야 보여.”'
    : '어린 에코가 금 간 바닥을 가리킨다. “달이 비치는 돌 사이에 첫 번째 기억이 숨어 있어.”';
  const wardenText=inherited
    ? '갑옷을 두른 수호 에코가 오래된 기척을 알아본다. “너에게는 이전 세대에서 이어진 약속의 흔적이 있군. 이 봉인도 그 기억에 응답할 것이다.”'
    : '갑옷을 두른 수호 에코가 석문을 지킨다. “힘으로 밀지 마라. 룬의 순서를 기억하고, 신전이 스스로 문을 열게 하라.”';

  return {
    'shrine-keeper-echo':{
      id:'shrine-keeper-echo',eyebrow:'OLD SHRINE · KEEPER',title:resolved?'다시 켜진 등불':'잠든 문지기',speaker:'문지기 에코',
      text:keeperText,artSrc:shrineAsset('keeper-echo.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'에코의 말을 듣기',progression:false,
    },
    'shrine-child-echo':{
      id:'shrine-child-echo',eyebrow:'OLD SHRINE · MEMORY',title:'돌계단의 작은 목소리',speaker:'어린 에코',
      text:childText,artSrc:shrineAsset('child-echo.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'힌트를 기억하기',progression:false,
    },
    'shrine-warden-echo':{
      id:'shrine-warden-echo',eyebrow:'OLD SHRINE · WARDEN',title:'수호자의 경고',speaker:'수호 에코',
      text:wardenText,artSrc:shrineAsset('warden-echo.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'경고를 새기기',progression:false,
    },
  };
}

export function oldShrineExploration(progress:LivingRegionProgress,context:OldShrineContext):OldShrineExploration{
  const resolved=progress.phase==='mainQuestResolved'||progress.phase==='postResolution';
  const postResolution=progress.phase==='postResolution';
  const storyFrames:Record<string,ExplorationStoryFrame>={
    ...sensitiveFrames(context,resolved),
    'shrine-seal':{
      id:'shrine-seal',eyebrow:'MAIN QUEST · SEALED MEMORY',title:'세 겹의 기억 봉인',speaker:'루나',
      text:'금이 간 석문에는 서로 다른 세 개의 룬 자리가 비어 있다. 주변의 기억 흔적을 찾아 룬의 순서를 되살리면 봉인을 풀 수 있을 것 같다.',
      artSrc:shrineAsset('sealed-gate.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'봉인을 조사하기',progression:false,
    },
    'shrine-moon-inscription':{
      id:'shrine-moon-inscription',eyebrow:'DISCOVERY',title:'달빛에만 보이는 글자',speaker:'루나',
      text:'기울어진 비석을 지나자 희미한 글자가 떠오른다. “기억은 사라지지 않고, 다음 걸음의 방향이 된다.” 첫 번째 신전 기록이다.',
      artSrc:shrineAsset('moon-inscription.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'문양을 기록하기',progression:false,
    },
    'shrine-rune-device':{
      id:'shrine-rune-device',eyebrow:'RUNE DEVICE',title:'멈춘 별자리 장치',speaker:'루나',
      text:'석문을 조사한 뒤 보니 원형 장치의 홈이 봉인의 룬과 이어져 있다. 빛나는 홈을 따라가자 두 번째 기억 패턴이 완성된다.',
      artSrc:shrineAsset('rune-device.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'룬 배열 맞추기',progression:false,
    },
    'shrine-memory-shard':{
      id:'shrine-memory-shard',eyebrow:'MEMORY FRAGMENT',title:'남겨진 기억 조각',speaker:'기억의 메아리',
      text:'부서진 제단 아래에서 푸른 조각이 떠오른다. 세 번째 기억이 룬 장치와 공명하며 석문 쪽으로 가느다란 빛을 보낸다.',
      artSrc:shrineAsset('memory-shard.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'기억을 받아들이기',progression:false,
    },
    'shrine-rune-core':{
      id:'shrine-rune-core',eyebrow:'MAIN QUEST · RESOLUTION',title:'잠든 봉인을 깨우다',speaker:'루나',
      text:'세 기억의 순서가 하나로 이어진다. 룬 중심부가 천천히 회전하고, 수백 년 닫혀 있던 석문이 안쪽으로 움직이기 시작한다.',
      artSrc:shrineAsset('rune-core.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'봉인을 해방하기',progression:false,
    },
    'shrine-open-sanctum':{
      id:'shrine-open-sanctum',eyebrow:'REVISIT · OPEN SANCTUM',title:'열린 안쪽 성소',speaker:'루나',
      text:postResolution
        ?'다시 찾은 성소에는 전보다 많은 빛이 머문다. 벽의 룬도 이제 루나가 다가가면 먼저 반응한다. 이곳은 더 이상 잠든 폐허가 아니다.'
        :'열린 문 너머에서 따뜻한 빛이 번진다. 사라졌던 신전의 길이 다시 이어졌고, 에코들의 목소리도 한결 선명해졌다.',
      artSrc:shrineAsset('open-gate.svg'),frameSrc:shrineAsset('story-frame.svg'),actionLabel:'새 길을 확인하기',progression:false,
    },
  };

  const interactables:ExplorationInteractable[]=[
    {id:'shrine-exit',label:'여행자 교차로로 돌아가기',kind:'exit',position:{x:1200,y:1500},radius:115},
    {id:'shrine-echo-keeper',label:resolved?'문지기 에코와 다시 이야기하기':'문지기 에코에게 신전에 대해 묻기',kind:'story',position:{x:650,y:1120},radius:125,storyFrameId:'shrine-keeper-echo',artSrc:shrineAsset('keeper-echo.svg'),repeatable:true},
    {id:'shrine-echo-child',label:'돌계단의 어린 에코와 이야기하기',kind:'story',position:{x:1830,y:1110},radius:120,storyFrameId:'shrine-child-echo',artSrc:shrineAsset('child-echo.svg'),repeatable:true},
    {id:'shrine-echo-warden',label:'석문 수호 에코에게 다가가기',kind:'story',position:{x:1640,y:510},radius:125,storyFrameId:'shrine-warden-echo',artSrc:shrineAsset('warden-echo.svg'),repeatable:true},
    {id:'shrine-moon-inscription',label:'기울어진 달빛 비석 읽기',kind:'story',position:{x:430,y:620},radius:125,storyFrameId:'shrine-moon-inscription',artSrc:shrineAsset('moon-inscription.svg')},
  ];

  if(resolved){
    interactables.push({
      id:POST_RESOLUTION,label:'열린 성소 안쪽 확인하기',kind:'story',position:{x:1200,y:330},radius:155,
      storyFrameId:'shrine-open-sanctum',artSrc:shrineAsset('open-gate.svg'),repeatable:true,
    });
  }else{
    interactables.push(
      {id:QUEST_START,label:'봉인된 석문 조사하기',kind:'story',position:{x:1200,y:330},radius:150,storyFrameId:'shrine-seal',artSrc:shrineAsset('sealed-gate.svg')},
      {id:'shrine-rune-device',label:'별자리 룬 장치 맞추기',kind:'story',position:{x:780,y:650},radius:130,storyFrameId:'shrine-rune-device',artSrc:shrineAsset('rune-device.svg'),requiresCompleted:[QUEST_START]},
      {id:'shrine-memory-shard',label:'제단 아래 기억 조각 살펴보기',kind:'story',position:{x:1440,y:870},radius:130,storyFrameId:'shrine-memory-shard',artSrc:shrineAsset('memory-shard.svg'),requiresCompleted:['shrine-rune-device']},
      {id:QUEST_RESOLVE,label:'신전 중심 룬 다시 깨우기',kind:'story',position:{x:1200,y:690},radius:140,storyFrameId:'shrine-rune-core',artSrc:shrineAsset('rune-core.svg'),requiresCompleted:['shrine-rune-device','shrine-memory-shard']},
    );
  }

  const world:ExplorationWorldDefinition={
    id:'old-shrine',label:'고대 신전',
    objective:resolved
      ? postResolution?'다시 열린 신전을 돌아보며 달라진 에코와 성소를 확인하세요.':'열린 성소와 달라진 에코들을 확인해보세요.'
      : progress.phase==='mainQuestInProgress'?'신전의 기억 흔적을 모아 중심 룬의 봉인을 풀어보세요.':'봉인된 석문과 주변 에코를 살펴 신전의 기억을 깨워보세요.',
    width:2400,height:1600,playerRadius:22,playerSpeed:232,start:{x:1200,y:1320},
    layers:[
      {id:'ground',src:shrineAsset('shrine-ground.svg'),zIndex:0},
      {id:'ruins',src:shrineAsset('shrine-ruins.svg'),zIndex:3},
      ...(resolved?[{id:'resolved-light',src:shrineAsset('shrine-resolved-glow.svg'),zIndex:4}]:[]),
    ],
    obstacles:[
      {id:'west-wall',x:80,y:170,width:300,height:880},
      {id:'east-wall',x:2020,y:170,width:300,height:880},
      {id:'northwest-ruin',x:430,y:70,width:480,height:250},
      {id:'northeast-ruin',x:1490,y:70,width:480,height:250},
      {id:'west-pillar-row',x:640,y:770,width:220,height:430},
      {id:'east-pillar-row',x:1540,y:760,width:220,height:440},
      {id:'collapsed-altar',x:1010,y:930,width:380,height:170},
      {id:'southwest-rubble',x:140,y:1260,width:610,height:220},
      {id:'southeast-rubble',x:1650,y:1260,width:610,height:220},
    ],
    interactables,
  };

  return {
    world,storyFrames,discoveryByInteraction,
    questStartInteractionId:QUEST_START,
    questResolveInteractionId:QUEST_RESOLVE,
    postResolutionInteractionId:POST_RESOLUTION,
  };
}
