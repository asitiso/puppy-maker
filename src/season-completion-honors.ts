import type { SeasonJourneyHistoryEntry } from './live-ops-state';

export type SeasonCompletionHonorId = 'first_complete'|'four_seasons'|'perfect_year'|'eight_complete';
export type SeasonCompletionHonor = {
  id:SeasonCompletionHonorId;
  label:string;
  description:string;
  threshold:number;
  metric:'completedSeasons'|'completedSeasonTypes'|'perfectYears';
  reward:{ gold:number; gems:number };
};

export const seasonCompletionHonors:SeasonCompletionHonor[] = [
  {
    id:'first_complete',
    label:'첫 시즌 완주',
    description:'시즌 여정 10단계를 처음으로 모두 완주했어요.',
    threshold:1,
    metric:'completedSeasons',
    reward:{ gold:300, gems:0 },
  },
  {
    id:'four_seasons',
    label:'사계절 수호자',
    description:'봄·여름·가을·겨울 시즌을 모두 한 번 이상 완주했어요.',
    threshold:4,
    metric:'completedSeasonTypes',
    reward:{ gold:0, gems:2 },
  },
  {
    id:'perfect_year',
    label:'완벽한 한 해',
    description:'한 해의 봄·여름·가을·겨울 시즌을 모두 완주했어요.',
    threshold:1,
    metric:'perfectYears',
    reward:{ gold:600, gems:2 },
  },
  {
    id:'eight_complete',
    label:'시즌 베테랑',
    description:'누적 8개 시즌을 완주했어요.',
    threshold:8,
    metric:'completedSeasons',
    reward:{ gold:1000, gems:4 },
  },
];

const seasonIds = ['spring','summer','autumn','winter'] as const;

export function seasonHonorProgress(history:SeasonJourneyHistoryEntry[]) {
  const complete = history.filter(entry => entry.tiersCompleted >= 10);
  const completedSeasonTypes = new Set<string>();
  const years = new Map<number,Set<string>>();

  for (const entry of complete) {
    const [yearText,season] = entry.key.split('-');
    const year = Number(yearText);
    if (!Number.isFinite(year) || !seasonIds.includes(season as typeof seasonIds[number])) continue;
    completedSeasonTypes.add(season);
    const set = years.get(year) ?? new Set<string>();
    set.add(season);
    years.set(year,set);
  }

  const perfectYears = [...years.values()].filter(set => seasonIds.every(season => set.has(season))).length;
  return {
    completedSeasons:complete.length,
    completedSeasonTypes:completedSeasonTypes.size,
    perfectYears,
  };
}

export function newlyEarnedSeasonHonors(
  history:SeasonJourneyHistoryEntry[],
  claimed:SeasonCompletionHonorId[],
):SeasonCompletionHonor[] {
  const progress = seasonHonorProgress(history);
  return seasonCompletionHonors.filter(honor => !claimed.includes(honor.id) && progress[honor.metric] >= honor.threshold);
}
