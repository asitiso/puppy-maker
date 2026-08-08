import type { GuardianRankId } from './guardian-rank';

export type AnnualRecordId = `year-${number}`;

export type AnnualRecordInput = {
  year: number;
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

export type AnnualRecord = AnnualRecordInput & {
  id: AnnualRecordId;
};

export function annualRecord(input: AnnualRecordInput): AnnualRecord {
  return { ...input, id: `year-${Math.max(1, Math.floor(input.year))}` };
}

export function annualRecordIds(records: AnnualRecord[]): AnnualRecordId[] {
  return records.map(record => record.id);
}
