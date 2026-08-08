import type { ActivityId, Condition } from './game-core';
import { seasonalProfile } from './seasonal-cycle';

export type SmartScheduleInput = {
  month: number;
  condition: Condition;
};

export function smartSchedule({ month, condition }: SmartScheduleInput): ActivityId[] {
  const seasonal = seasonalProfile(month).activity;

  if (condition === 'tired') {
    return ['rest', 'herb', 'rest', seasonal];
  }

  if (condition === 'focused') {
    return [seasonal, seasonal, 'rest', 'herb'];
  }

  if (condition === 'energetic') {
    return [seasonal, seasonal, 'rest', 'herb'];
  }

  const balanced: ActivityId[] = [seasonal, 'hunt', 'magic', 'rest'];
  if (seasonal === 'hunt') return ['hunt', 'magic', 'rest', 'herb'];
  if (seasonal === 'magic') return ['magic', 'hunt', 'rest', 'herb'];
  if (seasonal === 'rest') return ['rest', 'hunt', 'magic', 'herb'];
  return balanced;
}
