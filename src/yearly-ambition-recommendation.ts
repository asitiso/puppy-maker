import type { GameState } from './game';
import type { YearlyAmbitionId } from './yearly-ambitions';

export type AmbitionRecommendedAction = 'schedule' | 'outing' | 'bond';

export type AmbitionRecommendation = {
  action: AmbitionRecommendedAction;
  label: string;
  reason: string;
};

export function ambitionRecommendation(ambition: YearlyAmbitionId, condition: GameState['condition']): AmbitionRecommendation {
  if (ambition === 'training') {
    if (condition === 'tired') return { action:'schedule', label:'회복 중심 스케줄', reason:'피로를 먼저 낮추고 다음 훈련을 준비해요.' };
    if (condition === 'focused') return { action:'schedule', label:'마법 집중 훈련', reason:'집중력이 좋은 날이라 마법 성장을 노리기 좋아요.' };
    if (condition === 'energetic') return { action:'schedule', label:'사냥 집중 훈련', reason:'활력이 높아 강도 있는 훈련 효율이 좋아요.' };
    return { action:'schedule', label:'훈련 스케줄', reason:'올해의 훈련 야망을 향해 한 달 성장을 쌓아요.' };
  }
  if (ambition === 'exploration') {
    return { action:'outing', label: condition === 'tired' ? '가벼운 호숫가 외출' : '새로운 외출', reason:'외출과 발견을 쌓아 탐험 야망을 진전시켜요.' };
  }
  if (ambition === 'bond') {
    return { action:'bond', label:'루나와 교감', reason:'선물과 기억을 쌓아 마음의 거리를 더 가까이 해요.' };
  }
  return { action:'outing', label:'계절 발자국 외출', reason:'꾸준한 외출로 올해의 사계 발자국을 채워요.' };
}
