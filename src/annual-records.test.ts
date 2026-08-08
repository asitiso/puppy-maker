import { describe, expect, it } from 'vitest';
import { annualRecord, annualRecordIds, type AnnualRecordInput } from './annual-records';

const input: AnnualRecordInput = {
  year: 1,
  trainings: 12,
  outings: 8,
  gifts: 4,
  sGrades: 3,
  bestScore: 1250,
  memories: 9,
  skills: 3,
  discoveries: 5,
  seasonStamps: 4,
  guardianRank: 'guardian',
};

describe('annual guardian records', () => {
  it('creates a stable historical snapshot', () => {
    expect(annualRecord(input)).toEqual({ ...input, id:'year-1' });
  });

  it('creates stable record ids', () => {
    expect(annualRecordIds([{...input,id:'year-1'}, {...input,year:2,id:'year-2'}])).toEqual(['year-1','year-2']);
  });
});
