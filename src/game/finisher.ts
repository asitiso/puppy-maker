// GDD 3.4: "콤보 게이지가 찰 때 [기 모으기] → [공격] 연계로 필살기 발동."
// Combo already existed as a counter; this adds the actual charge→release
// payoff. Reaching the threshold lets the next [기 모으기] press "charge"
// a finisher; the following [공격] press while charged lands it for a
// score bonus and resets the combo (a deliberate big release, not another
// incremental step).
export const FINISHER_COMBO_THRESHOLD = 5;
export const FINISHER_SCORE_BONUS = 1.2; // extra points added on top of the normal hit, as a multiple of that hit's base score

export interface FinisherState { combo: number; finisherCharged: boolean }
export interface FinisherResult { combo: number; finisherCharged: boolean; bonus: number }

export function applyFinisher(
  state: FinisherState,
  kind: 'attack' | 'dodge' | 'charge',
  accuracy: number,
  base: number,
): FinisherResult {
  const success = accuracy > 0.55;
  if (!success) return { combo: 0, finisherCharged: false, bonus: 0 };
  if (kind === 'attack' && state.finisherCharged) {
    return { combo: 0, finisherCharged: false, bonus: Math.round(base * FINISHER_SCORE_BONUS) };
  }
  if (kind === 'charge' && state.combo >= FINISHER_COMBO_THRESHOLD) {
    return { combo: state.combo + 1, finisherCharged: true, bonus: 0 };
  }
  return { combo: state.combo + 1, finisherCharged: state.finisherCharged, bonus: 0 };
}
