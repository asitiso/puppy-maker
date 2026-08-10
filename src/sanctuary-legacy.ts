export type SanctuaryLegacyRankId='hearth'|'beacon'|'chronicle'|'mythic'|'eternal';
export type SanctuaryLegacyPathId='mentor'|'wayfarer'|'keeper';
export type LegacyScoreInput={convergence:number;boons:number;grand:number;ascension:number;calling:number;rifts:number};
export type LegacyPathEffects={trainingPercent:number;expeditionJourney:number;convergenceJourney:number;monthlyJourney:number;fatigueRecovery:number;stressRecovery:number};

const clamp01=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function legacyScore(input:LegacyScoreInput){
  return Math.max(0,Math.min(100,Math.round(clamp01(input.convergence)*30+clamp01(input.boons)*15+clamp01(input.grand)*20+clamp01(input.ascension)*15+clamp01(input.calling)*10+clamp01(input.rifts)*10)));
}
export const sanctuaryLegacyRanks=[
  {id:'hearth' as const,name:'Hearth',threshold:0},
  {id:'beacon' as const,name:'Beacon',threshold:20},
  {id:'chronicle' as const,name:'Chronicle',threshold:40},
  {id:'mythic' as const,name:'Mythic',threshold:65},
  {id:'eternal' as const,name:'Eternal',threshold:85},
];
export function legacyRank(score:number){return [...sanctuaryLegacyRanks].reverse().find(rank=>score>=rank.threshold)??sanctuaryLegacyRanks[0];}
const empty:LegacyPathEffects={trainingPercent:0,expeditionJourney:0,convergenceJourney:0,monthlyJourney:0,fatigueRecovery:0,stressRecovery:0};
export function legacyPathEffects(path:SanctuaryLegacyPathId|null):LegacyPathEffects{
  if(path==='mentor') return {...empty,trainingPercent:5};
  if(path==='wayfarer') return {...empty,expeditionJourney:2,convergenceJourney:2};
  if(path==='keeper') return {...empty,monthlyJourney:2,fatigueRecovery:2,stressRecovery:2};
  return {...empty};
}
