import { seasonalProfile, type SeasonId } from './seasonal-cycle';

export type SeasonJourneyKey = `${number}-${SeasonId}`;
export type SeasonJourneyTierId = 1|2|3|4|5|6|7|8|9|10;

export type SeasonJourneyReward = { gold:number; gems:number; tokens:number };
export type SeasonJourneyTier = { tier:SeasonJourneyTierId; threshold:number; reward:SeasonJourneyReward };

export type SeasonJourneyAction =
  | { kind:'month_complete'; grade:'S'|'A'|'B'|'C' }
  | { kind:'outing' }
  | { kind:'gift' }
  | { kind:'expedition'; grade:'S'|'A'|'B'|'C'; bossFirstClear:boolean };

export const seasonJourneyTiers: SeasonJourneyTier[] = [
  { tier:1, threshold:50, reward:{ gold:150, gems:0, tokens:10 } },
  { tier:2, threshold:100, reward:{ gold:200, gems:0, tokens:12 } },
  { tier:3, threshold:175, reward:{ gold:250, gems:1, tokens:14 } },
  { tier:4, threshold:250, reward:{ gold:300, gems:0, tokens:16 } },
  { tier:5, threshold:350, reward:{ gold:350, gems:1, tokens:18 } },
  { tier:6, threshold:475, reward:{ gold:400, gems:0, tokens:20 } },
  { tier:7, threshold:625, reward:{ gold:450, gems:1, tokens:22 } },
  { tier:8, threshold:800, reward:{ gold:500, gems:0, tokens:25 } },
  { tier:9, threshold:1000, reward:{ gold:600, gems:1, tokens:30 } },
  { tier:10, threshold:1250, reward:{ gold:800, gems:2, tokens:40 } },
];

export function seasonJourneyKey(year:number, month:number): SeasonJourneyKey {
  return `${Math.max(1, Math.floor(year))}-${seasonalProfile(month).season}` as SeasonJourneyKey;
}

export function seasonJourneyPoints(action:SeasonJourneyAction): number {
  if (action.kind === 'outing') return 10;
  if (action.kind === 'gift') return 5;
  if (action.kind === 'month_complete') return 25 + (action.grade === 'S' ? 10 : 0);
  const gradePoints = action.grade === 'S' ? 30 : action.grade === 'A' ? 20 : action.grade === 'B' ? 10 : 0;
  return gradePoints + (action.bossFirstClear ? 10 : 0);
}

export function journeyTierClaimKey(key:SeasonJourneyKey, tier:SeasonJourneyTierId) {
  return `${key}:${tier}` as const;
}

export function newlyEarnedJourneyTiers(previousScore:number, nextScore:number, claimedKeys:string[], key?:SeasonJourneyKey): SeasonJourneyTier[] {
  const floorPrevious = Math.max(0, Math.floor(previousScore));
  const floorNext = Math.max(floorPrevious, Math.floor(nextScore));
  return seasonJourneyTiers.filter(tier => {
    if (floorNext < tier.threshold || floorPrevious >= tier.threshold) return false;
    if (!key) return true;
    return !claimedKeys.includes(journeyTierClaimKey(key, tier.tier));
  });
}
