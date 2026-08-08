import type { GuardianCallingId } from './guardian-callings';

export type CallingMasteryState = Record<GuardianCallingId, number>;

export function emptyCallingMastery(): CallingMasteryState {
  return { vanguard:0, arcanist:0, caretaker:0, pathfinder:0 };
}

export function callingMasteryLevel(rawXp: number): 1 | 2 | 3 | 4 | 5 {
  const xp = Number.isFinite(rawXp) ? Math.max(0, Math.floor(rawXp)) : 0;
  if (xp >= 18) return 5;
  if (xp >= 12) return 4;
  if (xp >= 7) return 3;
  if (xp >= 3) return 2;
  return 1;
}
