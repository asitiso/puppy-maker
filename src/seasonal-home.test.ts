import { describe, expect, it } from 'vitest';
import { seasonalHomeSummary } from './seasonal-home';

describe('seasonal home summary', () => {
  it('summarizes the current month without storing extra state', () => {
    expect(seasonalHomeSummary(4)).toEqual({
      title: '봄 · 꽃바람',
      recommendation: '약초 채집 · 별빛 숲',
    });
  });

  it('changes recommendations as the month changes', () => {
    expect(seasonalHomeSummary(7).recommendation).toBe('사냥 훈련 · 바람 호숫가');
    expect(seasonalHomeSummary(10).recommendation).toBe('마법 수업 · 마법 마을');
    expect(seasonalHomeSummary(1).recommendation).toBe('포근한 휴식 · 바람 호숫가');
  });
});
