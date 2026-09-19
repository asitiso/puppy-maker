import type {AdventureFieldDefinition} from './types';

export const STARTING_FIELD:AdventureFieldDefinition={
  id:'dawnreach-meadow',
  label:'새벽들판',
  halfSize:105,
  spawn:{x:0,y:0,z:26},
  discoveries:[
    {id:'skywatch',kind:'vista',label:'별바람 전망대',hint:'높은 돌기둥 위에서 들판 전체를 내려다볼 수 있다.',position:{x:0,y:12,z:-66},radius:7,height:20,importance:3},
    {id:'echo-ruins',kind:'ruin',label:'메아리 폐허',hint:'빛이 새는 틈과 오래된 장치가 보인다.',position:{x:-54,y:0,z:-34},radius:8,height:8,importance:3},
    {id:'ember-camp',kind:'camp',label:'재빛 야영지',hint:'연기가 오르고 있다. 누군가 아직 이곳을 쓰는 듯하다.',position:{x:50,y:0,z:-40},radius:9,height:6,importance:3},
    {id:'fallen-cart',kind:'npc',label:'부서진 짐수레',hint:'바퀴 자국이 숲 가장자리 쪽으로 이어진다.',position:{x:-29,y:0,z:2},radius:5,height:2,importance:2},
    {id:'wind-crystal',kind:'resource',label:'바람결 결정',hint:'주변 공기가 미세하게 흔들린다.',position:{x:24,y:0,z:-5},radius:4,height:2,importance:1},
    {id:'stone-switch',kind:'puzzle',label:'묻힌 별문양 장치',hint:'서로 떨어진 돌판 두 개가 같은 빛을 낸다.',position:{x:-18,y:0,z:-49},radius:5,height:2,importance:2},
    {id:'hollow-cave',kind:'secret',label:'폭포 뒤 빈틈',hint:'바위 뒤쪽에서 차가운 바람이 새어 나온다.',position:{x:63,y:0,z:26},radius:6,height:4,importance:2},
    {id:'herb-ring',kind:'resource',label:'달이끼 군락',hint:'밤이 되면 더 밝아질 것 같은 식물 군락이다.',position:{x:-57,y:0,z:35},radius:5,height:1.2,importance:1},
    {id:'old-bridge',kind:'landmark',label:'끊어진 돌다리',hint:'반대편 절벽으로 이어지던 길의 흔적이다.',position:{x:12,y:0,z:61},radius:7,height:5,importance:2},
  ],
};

function smoothHill(distance:number,radius:number,height:number){
  if(distance>=radius)return 0;
  const t=1-distance/radius;
  return height*t*t*(3-2*t);
}

export function startingFieldHeight(x:number,z:number){
  const lookout=Math.hypot(x-STARTING_FIELD.discoveries[0].position.x,z-STARTING_FIELD.discoveries[0].position.z);
  const westRidge=Math.hypot(x+72,z+10);
  const southKnoll=Math.hypot(x-40,z-58);
  return smoothHill(lookout,28,12)+smoothHill(westRidge,34,4)+smoothHill(southKnoll,30,3);
}

export function nearestStartingFieldDiscovery(x:number,z:number,visited:ReadonlySet<string>){
  let best=null as (typeof STARTING_FIELD.discoveries)[number]|null;
  let bestDistance=Number.POSITIVE_INFINITY;
  for(const discovery of STARTING_FIELD.discoveries){
    if(visited.has(discovery.id))continue;
    const distance=Math.hypot(x-discovery.position.x,z-discovery.position.z);
    if(distance<=discovery.radius&&distance<bestDistance){
      best=discovery;
      bestDistance=distance;
    }
  }
  return best;
}

export function visibleStartingLandmarks(){
  return STARTING_FIELD.discoveries.filter(item=>item.importance===3);
}
