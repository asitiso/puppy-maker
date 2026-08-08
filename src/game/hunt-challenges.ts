export interface HuntChallenge {id:string;name:string;unlockMonth:number;requiredHuntLevel:number;targetScore:number;gold:number;ingredient:'golden_mushroom'|'spirit_leaf';amount:number}
export const huntChallenges:HuntChallenge[]=[
{id:'trail_target',name:'숲길 표적 시험',unlockMonth:2,requiredHuntLevel:1,targetScore:120,gold:120,ingredient:'golden_mushroom',amount:1},
{id:'moon_dash',name:'달빛 추적전',unlockMonth:5,requiredHuntLevel:2,targetScore:180,gold:220,ingredient:'spirit_leaf',amount:1},
{id:'guardian_trial',name:'수호자의 시험',unlockMonth:8,requiredHuntLevel:3,targetScore:240,gold:350,ingredient:'golden_mushroom',amount:2},
{id:'starlight_hunt',name:'별빛 대추적',unlockMonth:11,requiredHuntLevel:4,targetScore:300,gold:500,ingredient:'spirit_leaf',amount:2}];
export const availableHuntChallenges=(month:number,huntLevel:number)=>huntChallenges.filter(c=>month>=c.unlockMonth&&huntLevel>=c.requiredHuntLevel);
export const challengeById=(id:string)=>huntChallenges.find(c=>c.id===id);
export function challengeRank(score:number,target:number){if(score>=target*1.35)return'S';if(score>=target)return'A';if(score>=target*.75)return'B';return'C'}
export function challengeCleared(score:number,target:number){return score>=target}
