import type { AnnualRecord } from './annual-records';
import type { YearlyAmbitionSelections } from './yearly-ambition-selection';
import { ambitionDefinitions, ambitionProgress } from './yearly-ambitions';

function yearDeltaRecord(records: AnnualRecord[], year: number): AnnualRecord | null {
  const current = records.find(record => record.year === year);
  if (!current) return null;
  const previous = [...records].filter(record => record.year < year).sort((a, b) => b.year - a.year)[0];
  if (!previous) return current;
  const delta = (value: number, before: number) => Math.max(0, value - before);
  return {
    ...current,
    trainings:delta(current.trainings, previous.trainings),
    outings:delta(current.outings, previous.outings),
    gifts:delta(current.gifts, previous.gifts),
    sGrades:delta(current.sGrades, previous.sGrades),
    memories:delta(current.memories, previous.memories),
    skills:delta(current.skills, previous.skills),
    discoveries:delta(current.discoveries, previous.discoveries),
    seasonStamps:delta(current.seasonStamps, previous.seasonStamps),
  };
}

export function completedYearAmbition(records: AnnualRecord[], selections: YearlyAmbitionSelections, year: number) {
  const ambition = selections[year];
  if (!ambition) return null;
  const record = yearDeltaRecord(records, year);
  if (!record) return null;
  const definition = ambitionDefinitions.find(item => item.id === ambition);
  if (!definition) return null;
  return {
    definition,
    record,
    progress: ambitionProgress(ambition, record),
  };
}
