import type { AnnualRecord } from './annual-records';
import type { GuardianRankId } from './guardian-rank';

export type CurrentYearCumulative = {
  trainings: number;
  outings: number;
  gifts: number;
  sGrades: number;
  bestScore: number;
  memories: number;
  skills: number;
  discoveries: number;
  seasonStamps: number;
  guardianRank: GuardianRankId;
};

function delta(current: number, previous: number): number {
  return Math.max(0, current - previous);
}

export function currentYearAmbitionRecord(input: {
  year: number;
  annualRecords: AnnualRecord[];
  cumulative: CurrentYearCumulative;
}): AnnualRecord {
  const previous = [...input.annualRecords]
    .filter(record => record.year < input.year)
    .sort((a, b) => b.year - a.year)[0];
  const baseline = previous ?? {
    trainings:0, outings:0, gifts:0, sGrades:0, memories:0, skills:0, discoveries:0, seasonStamps:0,
  };
  return {
    id:`year-${input.year}-live`,
    year:input.year,
    trainings:delta(input.cumulative.trainings, baseline.trainings),
    outings:delta(input.cumulative.outings, baseline.outings),
    gifts:delta(input.cumulative.gifts, baseline.gifts),
    sGrades:delta(input.cumulative.sGrades, baseline.sGrades),
    bestScore:Math.max(0, input.cumulative.bestScore),
    memories:delta(input.cumulative.memories, baseline.memories),
    skills:delta(input.cumulative.skills, baseline.skills),
    discoveries:delta(input.cumulative.discoveries, baseline.discoveries),
    seasonStamps:delta(input.cumulative.seasonStamps, baseline.seasonStamps),
    guardianRank:input.cumulative.guardianRank,
  };
}
