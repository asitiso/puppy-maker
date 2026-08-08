import { describe, expect, it } from 'vitest';
import { ambitionRecommendation } from './yearly-ambition-recommendation';

describe('yearly ambition recommendations', () => {
  it('routes each ambition toward a distinct high-value action', () => {
    expect(ambitionRecommendation('training', 'normal').action).toBe('schedule');
    expect(ambitionRecommendation('exploration', 'normal').action).toBe('outing');
    expect(ambitionRecommendation('bond', 'normal').action).toBe('bond');
    expect(ambitionRecommendation('season', 'normal').action).toBe('outing');
  });

  it('protects tired Runa from aggressive training even under a training ambition', () => {
    expect(ambitionRecommendation('training', 'tired')).toEqual({ action:'schedule', label:'회복 중심 스케줄', reason:'피로를 먼저 낮추고 다음 훈련을 준비해요.' });
  });

  it('uses focused condition to recommend magic-oriented training', () => {
    expect(ambitionRecommendation('training', 'focused').label).toBe('마법 집중 훈련');
  });
});
