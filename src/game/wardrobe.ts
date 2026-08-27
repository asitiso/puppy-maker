export interface WardrobeEntry {
  id:string;
  name:string;
  description:string;
  hint:string;
  kind:'starter'|'destination'|'challenge'|'ending';
  requirement?:string|number;
}

export const wardrobe:WardrobeEntry[]=[
  {id:'runa_classic',name:'루나의 기본 리본',description:'처음부터 함께한 루나의 상징',hint:'처음부터 보유',kind:'starter'},
  {id:'forest_charm',name:'숲길 부적',description:'첫 모험을 기억하는 작은 장식',hint:'숲길을 발견하세요',kind:'destination',requirement:'forest_path'},
  {id:'brook_ribbon',name:'물빛 리본',description:'시냇물처럼 맑은 빛의 컬렉션 리본',hint:'시냇물 다리를 발견하세요',kind:'destination',requirement:'brook_bridge'},
  {id:'moon_brooch',name:'달빛 브로치',description:'달빛 정원의 은은한 빛을 담은 브로치',hint:'달빛 정원을 발견하세요',kind:'destination',requirement:'moon_garden'},
  {id:'market_bell',name:'마을의 작은 방울',description:'시장 사람들의 응원이 담긴 기념 장식',hint:'마을 시장을 발견하세요',kind:'destination',requirement:'village_market'},
  {id:'hunter_badge',name:'사냥꾼 휘장',description:'도전을 이겨낸 루나의 증표',hint:'사냥 챌린지를 2개 클리어하세요',kind:'challenge',requirement:2},
  {id:'sunset_pin',name:'노을빛 핀',description:'함께한 반년을 기억하는 따뜻한 핀',hint:'노을 초원을 발견하세요',kind:'destination',requirement:'sunset_meadow'},
  {id:'guardian_charm',name:'수호령 문장',description:'오래된 수호의 기억을 담은 문장',hint:'수호 제단을 발견하세요',kind:'destination',requirement:'old_shrine'},
  {id:'veteran_badge',name:'숙련 사냥꾼 휘장',description:'여러 시험을 넘어선 성장의 증표',hint:'사냥 챌린지를 5개 클리어하세요',kind:'challenge',requirement:5},
  {id:'crystal_star',name:'수정별 장식',description:'비밀 동굴에서 찾은 반짝이는 기념품',hint:'수정 동굴을 발견하세요',kind:'destination',requirement:'crystal_cave'},
  {id:'starlight_crown',name:'별빛 화관',description:'12개월의 여정을 기념하는 컬렉션 장식',hint:'육성을 완주하세요',kind:'ending'},
  {id:'guardian_medal',name:'수호자의 메달',description:'모든 사냥 시험을 통과한 루나의 증표',hint:'사냥 챌린지를 8개 클리어하세요',kind:'challenge',requirement:8},
];

export interface WardrobeProgress {
  monthsCompleted?:number;
  discoveredDestinations?:readonly string[];
  huntChallengeClears?:readonly string[];
  endingCollection?:readonly string[];
  expeditionRecords?:Record<string,{cleared?:boolean}>;
  careerRecords?:{monthsCompleted?:number};
}

const expeditionWardrobeBridge:Record<string,string>={
  forest_path:'forest_path',
  forest_glade:'brook_bridge',
  forest_guardian:'old_shrine',
  city_square:'village_market',
  city_gallery:'crystal_cave',
  lake_channel:'moon_garden',
  lake_cliff:'sunset_meadow',
};

function normalizedDiscoveries(state:WardrobeProgress):string[]{
  const legacy=Array.isArray(state.discoveredDestinations)?state.discoveredDestinations:[];
  const current=Object.entries(state.expeditionRecords??{})
    .filter(([,record])=>record?.cleared===true)
    .map(([stageId])=>expeditionWardrobeBridge[stageId])
    .filter((value):value is string=>Boolean(value));
  return [...new Set([...legacy,...current])];
}

export function isWardrobeUnlocked(item:WardrobeEntry,state:WardrobeProgress){
  const discoveries=normalizedDiscoveries(state);
  const challenges=Array.isArray(state.huntChallengeClears)?state.huntChallengeClears:[];
  const endings=Array.isArray(state.endingCollection)?state.endingCollection:[];
  const directMonths=Number.isFinite(state.monthsCompleted)?Number(state.monthsCompleted):0;
  const careerMonths=Number.isFinite(state.careerRecords?.monthsCompleted)?Number(state.careerRecords?.monthsCompleted):0;
  const months=Math.max(0,directMonths,careerMonths);
  if(item.kind==='starter')return true;
  if(item.kind==='destination')return discoveries.includes(String(item.requirement));
  if(item.kind==='challenge')return challenges.length>=Number(item.requirement);
  return months>=12||endings.length>0;
}

export const unlockedWardrobe=(state:WardrobeProgress)=>wardrobe.filter(item=>isWardrobeUnlocked(item,state)).map(item=>item.id);
