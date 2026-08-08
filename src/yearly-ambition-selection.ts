import { ambitionDefinitions, type YearlyAmbitionId } from './yearly-ambitions';

export type YearlyAmbitionSelections = Record<number, YearlyAmbitionId>;

const validIds = new Set(ambitionDefinitions.map(item => item.id));

export function readAmbitionSelections(raw: unknown): YearlyAmbitionSelections {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const result: YearlyAmbitionSelections = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const year = Number(key);
    if (!Number.isInteger(year) || year < 1) continue;
    if (typeof value !== 'string' || !validIds.has(value as YearlyAmbitionId)) continue;
    result[year] = value as YearlyAmbitionId;
  }
  return result;
}

export function selectionForYear(selections: YearlyAmbitionSelections, year: number): YearlyAmbitionId | null {
  return selections[year] ?? null;
}

export function setAmbitionForYear(selections: YearlyAmbitionSelections, year: number, ambition: YearlyAmbitionId): YearlyAmbitionSelections {
  if (!Number.isInteger(year) || year < 1 || !validIds.has(ambition)) return { ...selections };
  return { ...selections, [year]: ambition };
}
