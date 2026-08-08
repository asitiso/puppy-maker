import type { YearlyAmbitionId } from './yearly-ambitions';

export type AmbitionDefinitionLike = {
  id: YearlyAmbitionId;
  label: string;
  description: string;
  target: number;
};

export type AmbitionProgressLike = {
  current: number;
  target: number;
  percent: number;
  complete: boolean;
};

export type AmbitionDisplay = {
  mode: 'choose' | 'progress' | 'complete';
  label: string;
  detail: string;
};

export function ambitionDisplay(definition: AmbitionDefinitionLike | null, progress: AmbitionProgressLike | null): AmbitionDisplay {
  if (!definition || !progress) return {
    mode:'choose',
    label:'올해의 야망을 선택하세요',
    detail:'한 해의 플레이 방향이 달라져요.',
  };
  if (progress.complete) return {
    mode:'complete',
    label:definition.label,
    detail:'올해의 야망 달성!',
  };
  return {
    mode:'progress',
    label:definition.label,
    detail:`${Math.max(0, progress.target - progress.current)} 남음 · ${Math.max(0, Math.min(100, progress.percent))}%`,
  };
}
