import type {ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';

const villageAsset=(name:string)=>`/assets/exploration/village/${name}`;
const sharedFrame='/assets/exploration/forest/story-frame.svg';

export const villageWorld:ExplorationWorldDefinition={
  id:'magic-village',
  label:'마법 마을',
  objective:'광장을 지나 사람들의 소리를 따라가 보세요.',
  width:2400,
  height:1500,
  playerRadius:22,
  playerSpeed:240,
  start:{x:1180,y:1320},
  layers:[
    {id:'ground',src:villageAsset('village-ground.svg'),zIndex:0},
    {id:'buildings',src:villageAsset('village-buildings.svg'),zIndex:3},
  ],
  obstacles:[
    {id:'west-houses',x:70,y:120,width:520,height:360},
    {id:'north-shops',x:720,y:40,width:560,height:280},
    {id:'tower-block',x:1540,y:80,width:480,height:390},
    {id:'east-workshop',x:1970,y:520,width:330,height:390},
    {id:'market-stalls',x:760,y:650,width:390,height:180},
    {id:'fountain',x:1300,y:560,width:210,height:190},
    {id:'southwest-houses',x:100,y:900,width:480,height:330},
    {id:'southeast-houses',x:1630,y:1030,width:600,height:310},
  ],
  interactables:[
    {id:'village-exit',label:'마을 입구로 돌아가기',kind:'exit',position:{x:1180,y:1390},radius:105},
    {id:'village-square',label:'광장 표지판 읽기',kind:'story',position:{x:1310,y:850},radius:125,storyFrameId:'village-square',artSrc:villageAsset('village-square.svg')},
    {id:'street-performance',label:'거리 공연 가까이 가기',kind:'story',position:{x:690,y:560},radius:145,storyFrameId:'village-performance',artSrc:villageAsset('street-performance.svg')},
    {id:'wand-repair',label:'수리점의 반짝임 조사하기',kind:'story',position:{x:1870,y:700},radius:145,storyFrameId:'village-repair',artSrc:villageAsset('wand-repair.svg')},
    {id:'quiet-alley',label:'조용한 골목 살펴보기',kind:'story',position:{x:2010,y:1020},radius:130,storyFrameId:'village-alley',artSrc:villageAsset('quiet-alley.svg')},
  ],
};

export const villageStoryFrames:Record<string,ExplorationStoryFrame>={
  'village-square':{
    id:'village-square',eyebrow:'TOWN NOTICE',title:'광장에 모인 소문',speaker:'루나',
    text:'광장 게시판에는 오늘 밤 작은 마법 공연이 열린다는 쪽지가 겹겹이 붙어 있다. 멀리서 종소리와 박수 소리가 들린다.',
    artSrc:villageAsset('story-square.svg'),frameSrc:sharedFrame,actionLabel:'소리를 따라가기',progression:false,
  },
  'village-performance':{
    id:'village-performance',eyebrow:'STORY DISCOVERY',title:'별가루 거리 공연',speaker:'루나',
    text:'공연자의 지팡이가 흔들리자 별가루가 골목 위로 흩어진다. 루나는 관객 사이에서 누군가 떨어뜨린 작은 부적을 발견했다.',
    artSrc:villageAsset('story-performance.svg'),frameSrc:sharedFrame,actionLabel:'공연을 도와주기',progression:true,
  },
  'village-repair':{
    id:'village-repair',eyebrow:'WORKSHOP MEMORY',title:'고장 난 지팡이',speaker:'수리공',
    text:'수리대 위의 지팡이는 불규칙하게 빛난다. 손잡이에 새겨진 오래된 문양이 루나가 다가서자 잠깐 선명해졌다.',
    artSrc:villageAsset('story-repair.svg'),frameSrc:sharedFrame,actionLabel:'문양을 기억하기',progression:false,
  },
  'village-alley':{
    id:'village-alley',eyebrow:'HIDDEN CORNER',title:'등불 뒤의 골목',speaker:'루나',
    text:'사람 없는 골목 끝에서 작은 종이 한 번 울린다. 바람도 없는데 등불이 같은 방향으로 천천히 기울었다.',
    artSrc:villageAsset('story-alley.svg'),frameSrc:sharedFrame,actionLabel:'골목을 살펴보기',progression:false,
  },
};
