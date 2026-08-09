import type { SanctuaryConstellationId } from './sanctuary-constellations';

export type AstralTrialId = 'scholar_trial'|'wayfarer_trial'|'guardian_trial'|'crown_trial';
export type AstralTrialGrade = 'B'|'A'|'S';

export type AstralTrialDefinition = {
  id:AstralTrialId;
  label:string;
  description:string;
  requiredConstellation:SanctuaryConstellationId;
};

export const astralTrialDefinitions:AstralTrialDefinition[] = [
  { id:'scholar_trial', label:'학자의 성광 시련', description:'지성과 마력의 조화를 시험해요.', requiredConstellation:'scholar_star' },
  { id:'wayfarer_trial', label:'방랑자의 별길 시련', description:'힘과 마음의 균형으로 길을 개척해요.', requiredConstellation:'wayfarer_star' },
  { id:'guardian_trial', label:'수호자의 서약 시련', description:'수호자로서의 종합 역량을 시험해요.', requiredConstellation:'guardian_star' },
  { id:'crown_trial', label:'천상의 왕관 시련', description:'모든 성장의 결실을 하나로 모아요.', requiredConstellation:'celestial_crown' },
];

export function astralTrialFor(year:number,month:number):AstralTrialDefinition {
  const safeYear = Number.isFinite(year) ? Math.max(1,Math.floor(year)) : 1;
  const safeMonth = Number.isFinite(month) ? Math.max(1,Math.min(12,Math.floor(month))) : 1;
  const index = ((safeYear - 1) * 12 + safeMonth - 1) % astralTrialDefinitions.length;
  return astralTrialDefinitions[index];
}

type TrialPowerInput = {
  trial:AstralTrialId;
  stats:{ strength:number; intelligence:number; magic:number; morality:number };
  sanctuaryProgress:number;
  constellationCount:number;
};

function clampStat(value:number):number {
  return Number.isFinite(value) ? Math.max(0,Math.min(100,value)) : 0;
}

export function astralTrialPower(input:TrialPowerInput):number {
  const stats = {
    strength:clampStat(input.stats.strength),
    intelligence:clampStat(input.stats.intelligence),
    magic:clampStat(input.stats.magic),
    morality:clampStat(input.stats.morality),
  };
  let focus = 0;
  if (input.trial === 'scholar_trial') focus = (stats.intelligence + stats.magic) / 2;
  else if (input.trial === 'wayfarer_trial') focus = (stats.strength + stats.morality) / 2;
  else if (input.trial === 'guardian_trial') focus = (stats.strength + stats.morality + stats.intelligence) / 3;
  else focus = (stats.strength + stats.intelligence + stats.magic + stats.morality) / 4;
  const progress = Number.isFinite(input.sanctuaryProgress) ? Math.max(0,Math.min(65,input.sanctuaryProgress)) : 0;
  const count = Number.isFinite(input.constellationCount) ? Math.max(0,Math.min(5,Math.floor(input.constellationCount))) : 0;
  return Math.floor(focus * 0.7 + progress * 0.3 + count * 2.5);
}

function gradeFor(power:number):AstralTrialGrade {
  if (power >= 105) return 'S';
  if (power >= 80) return 'A';
  return 'B';
}

export function resolveAstralTrial(input:{
  year:number;
  month:number;
  power:number;
  constellations:SanctuaryConstellationId[];
  claimedKeys:string[];
}) {
  const trial = astralTrialFor(input.year,input.month);
  const key = `${Math.max(1,Math.floor(input.year))}-${Math.max(1,Math.min(12,Math.floor(input.month)))}:${trial.id}`;
  if (!input.constellations.includes(trial.requiredConstellation)) {
    return { accepted:false as const, reason:'constellation_locked' as const, trial, key, grade:null, starShards:0, gold:0 };
  }
  if (input.claimedKeys.includes(key)) {
    return { accepted:false as const, reason:'already_claimed' as const, trial, key, grade:null, starShards:0, gold:0 };
  }
  const power = Number.isFinite(input.power) ? Math.max(0,Math.floor(input.power)) : 0;
  const grade = gradeFor(power);
  const reward = grade === 'S' ? { starShards:3, gold:250 } : grade === 'A' ? { starShards:2, gold:150 } : { starShards:1, gold:80 };
  return { accepted:true as const, reason:null, trial, key, grade, ...reward };
}
