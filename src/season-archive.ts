import type { SeasonJourneyHistoryEntry } from './live-ops-state';

export type SeasonArchiveRank = '새싹'|'견습'|'성장'|'수호'|'별빛'|'전설';
export type SeasonArchiveRecord = SeasonJourneyHistoryEntry & { label:string; rank:SeasonArchiveRank };

const seasonLabels = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' } as const;

export function seasonArchiveRank(score:number):SeasonArchiveRank {
  if (score >= 1000) return '전설';
  if (score >= 625) return '별빛';
  if (score >= 350) return '수호';
  if (score >= 175) return '성장';
  if (score >= 50) return '견습';
  return '새싹';
}

export function seasonArchiveRecords(history:SeasonJourneyHistoryEntry[]):SeasonArchiveRecord[] {
  return [...history].reverse().map(entry => {
    const [yearText,seasonText] = entry.key.split('-') as [string,keyof typeof seasonLabels];
    return {
      ...entry,
      label:`${Number(yearText)}년차 ${seasonLabels[seasonText]}`,
      rank:seasonArchiveRank(entry.score),
    };
  });
}
