import type {ExplorationWorldDefinition} from './exploration-types';

const crossroadsAsset=(name:string)=>`/assets/exploration/crossroads/${name}`;

export const outingCrossroadsWorld:ExplorationWorldDefinition={
  id:'outing-crossroads',
  label:'여행자 교차로',
  objective:'세 갈래 길을 직접 걸어 원하는 지역의 표식을 찾아보세요.',
  width:2400,
  height:1600,
  playerRadius:22,
  playerSpeed:238,
  start:{x:1200,y:1320},
  layers:[
    {id:'ground',src:crossroadsAsset('crossroads-ground.svg'),zIndex:0},
    {id:'landscape',src:crossroadsAsset('crossroads-landmarks.svg'),zIndex:3},
  ],
  obstacles:[
    {id:'northwest-grove',x:0,y:0,width:760,height:360},
    {id:'northeast-grove',x:1640,y:0,width:760,height:360},
    {id:'west-upper-ridge',x:0,y:340,width:210,height:300},
    {id:'west-lower-ridge',x:0,y:930,width:520,height:390},
    {id:'east-upper-reeds',x:2190,y:300,width:210,height:310},
    {id:'east-lower-reeds',x:1870,y:1110,width:530,height:320},
    {id:'plaza-left-planter',x:790,y:910,width:210,height:125},
    {id:'plaza-right-planter',x:1400,y:910,width:210,height:125},
    {id:'southwest-grove',x:260,y:1370,width:580,height:190},
    {id:'southeast-grove',x:1560,y:1370,width:580,height:190},
  ],
  interactables:[
    {
      id:'crossroads-exit',label:'집으로 돌아가기',kind:'exit',
      position:{x:1200,y:1490},radius:105,
    },
    {
      id:'crossroads-forest',label:'별빛 숲으로 들어가기',kind:'portal',destinationId:'forest',
      position:{x:1200,y:250},radius:150,artSrc:crossroadsAsset('forest-gate.svg'),
    },
    {
      id:'crossroads-village',label:'마법 마을로 들어가기',kind:'portal',destinationId:'village',
      position:{x:345,y:760},radius:150,artSrc:crossroadsAsset('village-gate.svg'),
    },
    {
      id:'crossroads-lakeside',label:'바람 호숫가로 내려가기',kind:'portal',destinationId:'lakeside',
      position:{x:2050,y:835},radius:150,artSrc:crossroadsAsset('lakeside-gate.svg'),
    },
  ],
};
