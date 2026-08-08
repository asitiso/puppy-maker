import type { ActivityId, Condition } from './game-core';
import type { MonthlyFocusId } from './monthly-focus';
import { seasonalProfile } from './seasonal-cycle';

export type SmartScheduleInput = {
  month: number;
  condition: Condition;
  focus?: MonthlyFocusId;
};

export function smartSchedule({ month, condition, focus = 'balanced' }: SmartScheduleInput): ActivityId[] {
  const seasonal = seasonalProfile(month).activity;

  if (condition === 'tired') {
    return ['rest', 'herb', 'rest', seasonal];
  }

  if (condition === 'focused' || condition === 'energetic') {
    if (focus === 'recovery') return ['rest', seasonal, 'rest', 'herb'];
    if (focus === 'hunt' && seasonal !== 'hunt') return ['hunt', seasonal, 'rest', 'herb'];
    if (focus === 'magic' && seasonal !== 'magic') return ['magic', seasonal, 'rest', 'herb'];
    return [seasonal, seasonal, 'rest', 'herb'];
  }

  if (focus === 'hunt') {
    return ['hunt', 'hunt', seasonal === 'hunt' ? 'herb' : seasonal, 'rest'];
  }

  if (focus === 'magic') {
    return ['magic', 'magic', seasonal === 'magic' ? 'herb' : seasonal, 'rest'];
  }

  if (focus === 'recovery') {
    return ['rest', 'herb', 'rest', seasonal];
  }

  const balanced: ActivityId[] = [seasonal, 'hunt', 'magic', 'rest'];
  if (seasonal === 'hunt') return ['hunt', 'magic', 'rest', 'herb'];
  if (seasonal === 'magic') return ['magic', 'hunt', 'rest', 'herb'];
  if (seasonal === 'rest') return ['rest', 'hunt', 'magic', 'herb'];
  return balanced;
}
