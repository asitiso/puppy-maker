import type {ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';

const forestAsset=(name:string)=>`/assets/exploration/forest/${name}`;

export const forestWorld:ExplorationWorldDefinition={
  id:'starlight-forest',
  label:'별빛 숲',
  objective:'빛나는 흔적을 직접 찾아가 조사하세요.',
  width:2200,
  height:1400,
  playerRadius:22,
  playerSpeed:235,
  start:{x:340,y:1120},
  layers:[
    {id:'ground',src:forestAsset('forest-ground.svg'),zIndex:0},
    {id:'trees',src:forestAsset('forest-trees.svg'),zIndex:3},
  ],
  obstacles:[
    {id:'grove-nw',x:70,y:70,width:360,height:250},
    {id:'grove-north',x:650,y:20,width:430,height:230},
    {id:'grove-ne',x:1530,y:50,width:500,height:270},
    {id:'grove-west',x:0,y:500,width:250,height:300},
    {id:'stone-center',x:920,y:610,width:180,height:150},
    {id:'grove-east',x:1780,y:500,width:330,height:300},
    {id:'grove-se',x:1570,y:1100,width:480,height:230},
    {id:'grove-sw',x:0,y:1170,width:180,height:190},
    {id:'fallen-log',x:700,y:930,width:330,height:100},
  ],
  interactables:[
    {
      id:'forest-exit',label:'숲 입구로 돌아가기',kind:'exit',
      position:{x:260,y:1190},radius:105,
    },
    {
      id:'ancient-tree',label:'오래된 나무 살펴보기',kind:'story',
      position:{x:520,y:430},radius:145,storyFrameId:'forest-tree',
      artSrc:forestAsset('ancient-tree.svg'),
    },
    {
      id:'glowing-tracks',label:'빛나는 발자국 조사하기',kind:'story',
      position:{x:1420,y:720},radius:135,storyFrameId:'forest-tracks',
      artSrc:forestAsset('glowing-tracks.svg'),
    },
  ],
};

export const forestStoryFrames:Record<string,ExplorationStoryFrame>={
  'forest-tracks':{
    id:'forest-tracks',
    eyebrow:'STORY DISCOVERY',
    title:'별빛이 남긴 흔적',
    speaker:'루나',
    text:'풀잎 사이로 별빛이 묻은 발자국이 이어진다. 루나는 고개를 들고 더 깊은 숲을 바라봤다.',
    artSrc:forestAsset('story-tracks.svg'),
    frameSrc:forestAsset('story-frame.svg'),
    actionLabel:'흔적을 따라가기',
    progression:true,
  },
  'forest-tree':{
    id:'forest-tree',
    eyebrow:'FOREST MEMORY',
    title:'오래된 나무의 숨결',
    speaker:'루나',
    text:'나무껍질 사이에서 작은 빛이 천천히 숨을 쉰다. 이 숲은 오래전부터 누군가를 기다린 것 같다.',
    artSrc:forestAsset('ancient-tree.svg'),
    frameSrc:forestAsset('story-frame.svg'),
    actionLabel:'기억해 두기',
    progression:false,
  },
};
