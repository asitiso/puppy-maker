import type {ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';

const lakeAsset=(name:string)=>`/assets/exploration/lakeside/${name}`;
const sharedFrame='/assets/exploration/forest/story-frame.svg';

export const lakesideWorld:ExplorationWorldDefinition={
  id:'wind-lakeside',
  label:'바람 호숫가',
  objective:'물가의 이상한 잔물결을 살펴보고 바람이 숨긴 다음 흔적을 찾으세요.',
  width:2300,
  height:1450,
  playerRadius:22,
  playerSpeed:232,
  start:{x:330,y:1080},
  layers:[
    {id:'ground',src:lakeAsset('lakeside-ground.svg'),zIndex:0},
    {id:'shore',src:lakeAsset('lakeside-shore.svg'),zIndex:3},
  ],
  obstacles:[
    {id:'deep-water',x:850,y:0,width:1450,height:500},
    {id:'west-reeds',x:70,y:110,width:350,height:250},
    {id:'north-bank',x:460,y:70,width:270,height:210},
    {id:'rock-ridge',x:1020,y:620,width:330,height:170},
    {id:'east-reeds',x:1880,y:540,width:300,height:330},
    {id:'south-rocks',x:1180,y:1190,width:530,height:180},
    {id:'southwest-brush',x:0,y:1240,width:300,height:170},
  ],
  interactables:[
    {id:'lakeside-exit',label:'호숫가 입구로 돌아가기',kind:'exit',position:{x:250,y:1120},radius:105},
    {id:'water-edge',label:'물가의 잔물결 살펴보기',kind:'story',position:{x:760,y:560},radius:135,storyFrameId:'lakeside-water',artSrc:lakeAsset('water-edge.svg')},
    {id:'silver-fish',label:'새로 나타난 은빛 물고기 따라가기',kind:'story',position:{x:1520,y:540},radius:145,storyFrameId:'lakeside-fish',artSrc:lakeAsset('silver-fish.svg'),requiresCompleted:['water-edge']},
    {id:'resting-stone',label:'바람 부는 쉼터에 앉기',kind:'story',position:{x:620,y:1010},radius:130,storyFrameId:'lakeside-rest',artSrc:lakeAsset('resting-stone.svg')},
    {id:'wind-crystal',label:'바람 결정 조사하기',kind:'story',position:{x:1860,y:930},radius:145,storyFrameId:'lakeside-crystal',artSrc:lakeAsset('wind-crystal.svg')},
  ],
};

export const lakesideStoryFrames:Record<string,ExplorationStoryFrame>={
  'lakeside-water':{
    id:'lakeside-water',eyebrow:'SHORELINE',title:'물 위에 남은 선',speaker:'루나',
    text:'잔잔하던 수면에 한 줄의 빛이 생겨 동쪽으로 미끄러진다. 빛이 사라진 자리에서 은빛 꼬리가 한 번 번쩍였다.',
    artSrc:lakeAsset('water-edge.svg'),frameSrc:sharedFrame,actionLabel:'물결의 방향 기억하기',progression:false,
  },
  'lakeside-fish':{
    id:'lakeside-fish',eyebrow:'STORY DISCOVERY',title:'은빛 물고기의 길',speaker:'루나',
    text:'조금 전 물결 속에 숨었던 은빛 물고기가 다시 모습을 드러낸다. 수면을 세 번 튀어 오르자 바람이 방향을 바꾸고 작은 길이 드러났다.',
    artSrc:lakeAsset('silver-fish.svg'),frameSrc:sharedFrame,actionLabel:'새 길을 기억하기',progression:true,
  },
  'lakeside-rest':{
    id:'lakeside-rest',eyebrow:'QUIET MOMENT',title:'바람이 쉬어 가는 돌',speaker:'루나',
    text:'따뜻한 돌 위에 앉으니 풀잎 소리와 물결 소리가 겹쳐 들린다. 잠시 멈추자 멀리 있던 소리까지 또렷해졌다.',
    artSrc:lakeAsset('resting-stone.svg'),frameSrc:sharedFrame,actionLabel:'조금 더 듣기',progression:false,
  },
  'lakeside-crystal':{
    id:'lakeside-crystal',eyebrow:'WIND MEMORY',title:'바람 결정의 공명',speaker:'루나',
    text:'푸른 결정이 낮게 울리며 호수 건너편을 가리킨다. 오래된 약속처럼 일정한 박동이 손끝까지 전해진다.',
    artSrc:lakeAsset('wind-crystal.svg'),frameSrc:sharedFrame,actionLabel:'공명을 기억하기',progression:false,
  },
};
