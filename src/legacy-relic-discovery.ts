import type { AnnualRecord } from './annual-records';
import { unlockedLegacyRelics, type LegacyRelicId } from './legacy-relics';

export function newlyUnlockedLegacyRelics(records: AnnualRecord[], currentRecordId: string): LegacyRelicId[] {
  const index = records.findIndex(record => record.id === currentRecordId);
  if (index < 0) return [];
  const before = new Set(unlockedLegacyRelics(records.slice(0, index)));
  return unlockedLegacyRelics(records.slice(0, index + 1)).filter(id => !before.has(id));
}
