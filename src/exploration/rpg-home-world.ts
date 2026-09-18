import type {ExplorationWorldDefinition} from './exploration-types';

const villageAsset=(name:string)=>`/assets/exploration/village/${name}`;
const gateAsset=(name:string)=>`/assets/exploration/crossroads/${name}`;

export const HOME_HUB_DESTINATIONS={
  life:'category:life',
  growth:'category:growth',
  outing:'feature:outing',
  expedition:'feature:expedition',
  bond:'category:bond',
  records:'category:records',
} as const;

export const rpgHomeWorld:ExplorationWorldDefinition={
  id:'starlight-home-hub',
  label:'별빛 마을',
  objective:'마을을 직접 걸어 오늘 할 일을 고르세요. 월드 게이트에서는 바로 지역 탐험을 시작할 수 있어요.',
  width:2400,
  height:1500,
  playerRadius:22,
  playerSpeed:245,
  start:{x:1180,y:1280},
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
    {
      id:'home-life',
      label:'생활관 · 일정과 휴식',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.life,
      position:{x:620,y:640},
      radius:135,
      artSrc:gateAsset('village-gate.svg'),
    },
    {
      id:'home-growth',
      label:'수련장 · 성장과 장비',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.growth,
      position:{x:1160,y:470},
      radius:135,
      artSrc:gateAsset('old-shrine-gate.svg'),
    },
    {
      id:'home-outing',
      label:'월드 게이트 · 지역 탐험',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.outing,
      position:{x:1640,y:870},
      radius:145,
      artSrc:gateAsset('forest-gate.svg'),
    },
    {
      id:'home-expedition',
      label:'원정 게시판 · 전투 준비',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.expedition,
      position:{x:1810,y:610},
      radius:135,
      artSrc:gateAsset('expedition-outpost-gate.svg'),
    },
    {
      id:'home-bond',
      label:'인연 정원 · 대화와 선물',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.bond,
      position:{x:680,y:1080},
      radius:135,
      artSrc:gateAsset('herb-hills-gate.svg'),
    },
    {
      id:'home-records',
      label:'기록관 · 연대기와 업적',
      kind:'portal',
      destinationId:HOME_HUB_DESTINATIONS.records,
      position:{x:1320,y:1060},
      radius:135,
      artSrc:gateAsset('lakeside-gate.svg'),
    },
  ],
};
