export type AstralRiftRelicId =
  | 'vanguard_seed'|'vanguard_core'|'vanguard_crown'
  | 'arcane_seed'|'arcane_core'|'arcane_crown'
  | 'wayfinder_seed'|'wayfinder_core'|'wayfinder_crown';

export type AstralRiftRelic = {
  id:AstralRiftRelicId;
  branch:'vanguard'|'arcane'|'wayfinder';
  tier:1|2|3;
  label:string;
  description:string;
  cost:number;
  prerequisite:AstralRiftRelicId|null;
};

export const astralRiftRelics:AstralRiftRelic[] = [
  { id:'vanguard_seed', branch:'vanguard', tier:1, label:'성광 선봉의 파편', description:'균열 전선에 남은 첫 전투의 흔적이에요.', cost:15, prerequisite:null },
  { id:'vanguard_core', branch:'vanguard', tier:2, label:'성광 선봉의 핵', description:'압박을 돌파하는 전투 감각을 응축한 유물이에요.', cost:30, prerequisite:'vanguard_seed' },
  { id:'vanguard_crown', branch:'vanguard', tier:3, label:'성광 선봉의 왕관', description:'가장 깊은 균열을 돌파한 선봉의 증표예요.', cost:50, prerequisite:'vanguard_core' },
  { id:'arcane_seed', branch:'arcane', tier:1, label:'성운 비전의 파편', description:'균열 마력의 흐름을 읽기 시작한 유물이에요.', cost:15, prerequisite:null },
  { id:'arcane_core', branch:'arcane', tier:2, label:'성운 비전의 핵', description:'응축된 별빛 마력을 안정적으로 다루는 유물이에요.', cost:30, prerequisite:'arcane_seed' },
  { id:'arcane_crown', branch:'arcane', tier:3, label:'성운 비전의 왕관', description:'천체 마력의 흐름을 완전히 해석한 증표예요.', cost:50, prerequisite:'arcane_core' },
  { id:'wayfinder_seed', branch:'wayfinder', tier:1, label:'별길 나침의 파편', description:'균열 사이의 안전한 길을 기억하는 유물이에요.', cost:15, prerequisite:null },
  { id:'wayfinder_core', branch:'wayfinder', tier:2, label:'별길 나침의 핵', description:'깊은 균열의 자원과 길을 찾아내는 유물이에요.', cost:30, prerequisite:'wayfinder_seed' },
  { id:'wayfinder_crown', branch:'wayfinder', tier:3, label:'별길 나침의 왕관', description:'모든 균열의 길을 읽어낸 탐험가의 증표예요.', cost:50, prerequisite:'wayfinder_core' },
];

export function resolveAstralRiftRelicPurchase(input:{
  relicId:AstralRiftRelicId;
  echoes:number;
  purchased:AstralRiftRelicId[];
}) {
  const purchased = [...new Set(input.purchased)].filter(id => astralRiftRelics.some(item => item.id === id));
  const echoes = Number.isFinite(input.echoes) ? Math.max(0,Math.floor(input.echoes)) : 0;
  const relic = astralRiftRelics.find(item => item.id === input.relicId);
  if (!relic || purchased.includes(relic.id) || (relic.prerequisite && !purchased.includes(relic.prerequisite)) || echoes < relic.cost) {
    return { accepted:false as const, echoes, purchased };
  }
  return { accepted:true as const, echoes:echoes - relic.cost, purchased:[...purchased,relic.id] };
}
