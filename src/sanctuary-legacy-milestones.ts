export type SanctuaryLegacyMilestoneId='beacon'|'chronicle'|'mythic'|'eternal'|'four_guardians'|'deep_convergence'|'boon_circle'|'celestial_sanctuary'|'deep_ascension'|'calling_master'|'rift_breadth'|'rift_relics';
export type LegacyMilestoneProgress={score:number;convergenceGuardians:number;maxConvergenceIntensity:number;boons:number;celestialRank:boolean;ascension:number;callingMastery:number;riftClears:number;riftRelics:number};
export type LegacyMilestone={id:SanctuaryLegacyMilestoneId;label:string;reward:{gold:number;gems:number};complete:(p:LegacyMilestoneProgress)=>boolean};
const reward=(gold:number,gems:number)=>({gold,gems});
export const sanctuaryLegacyMilestones:LegacyMilestone[]=[
 {id:'beacon',label:'Legacy 20',reward:reward(300,2),complete:p=>p.score>=20},
 {id:'chronicle',label:'Legacy 40',reward:reward(500,3),complete:p=>p.score>=40},
 {id:'mythic',label:'Legacy 65',reward:reward(800,4),complete:p=>p.score>=65},
 {id:'eternal',label:'Legacy 85',reward:reward(1200,6),complete:p=>p.score>=85},
 {id:'four_guardians',label:'네 수호자',reward:reward(500,3),complete:p=>p.convergenceGuardians>=4},
 {id:'deep_convergence',label:'심층 Convergence',reward:reward(700,4),complete:p=>p.maxConvergenceIntensity>=3},
 {id:'boon_circle',label:'Guardian Boon',reward:reward(600,3),complete:p=>p.boons>=4},
 {id:'celestial_sanctuary',label:'Celestial Sanctuary',reward:reward(700,4),complete:p=>p.celestialRank},
 {id:'deep_ascension',label:'Deep Ascension',reward:reward(900,5),complete:p=>p.ascension>=65},
 {id:'calling_master',label:'Calling Mastery',reward:reward(600,3),complete:p=>p.callingMastery>=4},
 {id:'rift_breadth',label:'Rift Breadth',reward:reward(700,4),complete:p=>p.riftClears>=6},
 {id:'rift_relics',label:'Rift Relics',reward:reward(900,5),complete:p=>p.riftRelics>=6},
];
export function completedLegacyMilestones(progress:LegacyMilestoneProgress){return sanctuaryLegacyMilestones.filter(item=>item.complete(progress));}
export function claimableLegacyMilestones(progress:LegacyMilestoneProgress,claimed:readonly string[]){const seen=new Set(claimed);return completedLegacyMilestones(progress).filter(item=>!seen.has(item.id));}
export function legacyRewardTotal(items:readonly LegacyMilestone[]){return items.reduce((sum,item)=>({gold:sum.gold+item.reward.gold,gems:sum.gems+item.reward.gems}),{gold:0,gems:0});}
