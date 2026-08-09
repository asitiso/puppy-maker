import type { AstralRiftGrade, AstralRiftId } from './astral-rift';
import { astralRiftDefinitions } from './astral-rift';

export type AstralRiftDirectiveId = 'rift_clear'|'high_grade'|'featured_rift';
export type AstralRiftWeeklyDirective = {
  id:AstralRiftDirectiveId;
  label:string;
  target:number;
  rewardEchoes:number;
  featuredRift:AstralRiftId|null;
};

const gradeRank:Record<AstralRiftGrade,number> = { C:0, B:1, A:2, S:3 };
const clamp = (value:number,min:number,max:number) => Math.min(max,Math.max(min,Number.isFinite(value) ? Math.floor(value) : min));

export function astralRiftWeeklyKey(year:number,month:number,week:number) {
  return `${Math.max(1,Math.floor(year))}-${clamp(month,1,12)}-${clamp(week,1,4)}`;
}

export function astralRiftWeeklyDirectives(year:number,month:number,week:number):AstralRiftWeeklyDirective[] {
  const index = (Math.max(1,Math.floor(year)) * 48 + (clamp(month,1,12) - 1) * 4 + (clamp(week,1,4) - 1)) % astralRiftDefinitions.length;
  const featuredRift = astralRiftDefinitions[index].id;
  return [
    { id:'rift_clear', label:'균열 2회 돌파', target:2, rewardEchoes:4, featuredRift:null },
    { id:'high_grade', label:'A등급 이상 1회', target:1, rewardEchoes:3, featuredRift:null },
    { id:'featured_rift', label:`주간 추천 균열 돌파 · ${astralRiftDefinitions[index].label}`, target:1, rewardEchoes:5, featuredRift },
  ];
}

export function advanceAstralRiftWeekly(input:{
  directives:AstralRiftWeeklyDirective[];
  progress:Record<string,number>;
  rewardedKeys:string[];
  weekKey:string;
  event:{ riftId:AstralRiftId; grade:AstralRiftGrade; success:boolean };
}) {
  const progress = { ...input.progress };
  const rewardedKeys = [...new Set(input.rewardedKeys)];
  const completed:AstralRiftWeeklyDirective[] = [];
  let echoes = 0;

  for (const directive of input.directives) {
    const previous = clamp(progress[directive.id] ?? 0,0,directive.target);
    let increment = 0;
    if (input.event.success && directive.id === 'rift_clear') increment = 1;
    if (input.event.success && directive.id === 'high_grade' && gradeRank[input.event.grade] >= gradeRank.A) increment = 1;
    if (input.event.success && directive.id === 'featured_rift' && directive.featuredRift === input.event.riftId) increment = 1;
    const next = Math.min(directive.target,previous + increment);
    progress[directive.id] = next;
    const rewardKey = `${input.weekKey}:${directive.id}`;
    if (previous < directive.target && next >= directive.target && !rewardedKeys.includes(rewardKey)) {
      rewardedKeys.push(rewardKey);
      completed.push(directive);
      echoes += directive.rewardEchoes;
    }
  }

  return { progress, rewardedKeys, completed, echoes };
}
