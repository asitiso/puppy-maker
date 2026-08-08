import type { AnnualRecord } from './annual-records';

export type CeremonyState = {
  year: number;
  month: number;
  annualRecords: AnnualRecord[];
};

export function ceremonyRecord(state: CeremonyState): AnnualRecord | null {
  if (state.month !== 1) return null;
  return state.annualRecords.find(record => record.year === state.year - 1) ?? null;
}

export function shouldShowYearEndCeremony(state: CeremonyState, acknowledgedRecordIds: string[]): boolean {
  const record = ceremonyRecord(state);
  return Boolean(record && !acknowledgedRecordIds.includes(record.id));
}
