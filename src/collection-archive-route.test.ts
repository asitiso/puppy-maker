import { describe, expect, it } from 'vitest';
import { archiveRecommendationRoute } from './collection-archive-route';

describe('growth archive recommendation routing', () => {
  it('maps immediate recommendations to existing home destinations', () => {
    expect(archiveRecommendationRoute('training')).toBe('schedule');
    expect(archiveRecommendationRoute('outing')).toBe('outing');
    expect(archiveRecommendationRoute('bond')).toBe('bond');
    expect(archiveRecommendationRoute('event')).toBe('event');
    expect(archiveRecommendationRoute('quest')).toBe('quest');
  });

  it('keeps long-term recommendations inside their dedicated meta surfaces', () => {
    expect(archiveRecommendationRoute('ambition')).toBe('ambition');
    expect(archiveRecommendationRoute('annual')).toBe('archive');
  });

  it('does not navigate once the archive is complete', () => {
    expect(archiveRecommendationRoute('complete')).toBeNull();
  });
});
