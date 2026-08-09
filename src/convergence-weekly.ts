import type { CelestialGuardianId, ConvergenceGrade } from './celestial-convergence';

export type ConvergenceDirectiveId = 'convergence_clear'|'high_grade'|'featured_guardian';
export type ConvergenceDirective = {
  id:ConvergenceDirectiveId;
  label:string;
  target:number;
  featuredGuardian?:CelestialGuardianId;
};

const guardians:CelestialGuardianId[] = ['dawn_stag','moon_crane','storm_wolf','star_fox'];
const targets:Record<ConvergenceDirectiveId,number> = {
  convergence_clear:2,
  high_grade:1,
  featured_guardian:1,
};

export function convergenceWeeklyKey(year:number,month:number,week:number):string {
  const y = Math.max(1,Math.floor(year));
  const m = Math.min(12,Math.max(1,Math.floor(month)));
  const w = Math.min(4,Math.max(1,Math.floor(week)));
  return `${y}-${m}-${w}`;
}

export function convergenceWeeklyDirectives(year:number,month:number,week:number):ConvergenceDirective[] {
  const index = Math.abs((Math.floor(year) * 48 + Math.floor(month) * 4 + Math.floor(week)) % guardians.length);
  const featuredGuardian = guardians[index];
  return [
    { id:'convergence_clear', label:'천체 수호전 2회 승리', target:2 },
    { id:'high_grade', label:'A등급 이상 1회', target:1 },
    { id:'featured_guardian', label:'주간 수호자 격파', target:1, featuredGuardian },
  ];
}

export function advanceConvergenceWeekly(input:{
  directives:ConvergenceDirective[];
  progress:Record<string,number>;
  rewardedKeys:string[];
  weekKey:string;
  event:{ guardianId:CelestialGuardianId; grade:ConvergenceGrade; success:boolean };
}) {
  const progress:Record<string,number> = {};
  for (const directive of input.directives) {
    const previous = Math.min(directive.target,Math.max(0,Math.floor(input.progress[directive.id] ?? 0)));
    let increment = 0;
    if (input.event.success) {
      if (directive.id === 'convergence_clear') increment = 1;
      if (directive.id === 'high_grade' && (input.event.grade === 'A' || input.event.grade === 'S')) increment = 1;
      if (directive.id === 'featured_guardian' && directive.featuredGuardian === input.event.guardianId) increment = 1;
    }
    progress[directive.id] = Math.min(directive.target,previous + increment);
  }

  const rewardedKeys = [...new Set(input.rewardedKeys)];
  let sigils = 0;
  for (const directive of input.directives) {
    const key = `${input.weekKey}:${directive.id}`;
    if (progress[directive.id] >= targets[directive.id] && !rewardedKeys.includes(key)) {
      rewardedKeys.push(key);
      sigils += 2;
    }
  }
  return { progress, rewardedKeys, sigils };
}
