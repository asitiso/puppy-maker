import type { BattleResult } from './tactical-battle';
import type { FifthPathWinterOutcome } from './fifth-path-experience';

export type FifthPathBattleResolution = {
  result: BattleResult;
  survivingAllies: number;
  damageTaken: number;
};

/**
 * Converts the authoritative tactical result into the narrative outcome used by
 * the Fifth Path. A defeat always remains a defeat. A victory becomes costly
 * when the party was reduced to one survivor or the run crossed the supplied
 * damage budget.
 */
export function deriveFifthPathWinterOutcome(
  resolution: FifthPathBattleResolution,
  costlyDamageThreshold = 100,
): FifthPathWinterOutcome {
  if (resolution.result === 'defeat') return 'defeat';

  const survivors = Number.isFinite(resolution.survivingAllies)
    ? Math.max(0, Math.floor(resolution.survivingAllies))
    : 0;
  const damage = Number.isFinite(resolution.damageTaken)
    ? Math.max(0, resolution.damageTaken)
    : Number.POSITIVE_INFINITY;
  const threshold = Number.isFinite(costlyDamageThreshold)
    ? Math.max(0, costlyDamageThreshold)
    : 100;

  return survivors <= 1 || damage >= threshold ? 'costly_victory' : 'victory';
}
