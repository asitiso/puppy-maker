import type { HomeMenuId } from './home-panels';
import type { ArchiveRecommendationAction } from './collection-archive-recommendation';

export type ArchiveRecommendationRoute = HomeMenuId | 'ambition' | 'archive' | null;

export function archiveRecommendationRoute(action: ArchiveRecommendationAction): ArchiveRecommendationRoute {
  if (action === 'training') return 'schedule';
  if (action === 'outing') return 'outing';
  if (action === 'bond') return 'bond';
  if (action === 'event') return 'event';
  if (action === 'quest') return 'quest';
  if (action === 'ambition') return 'ambition';
  if (action === 'annual') return 'archive';
  return null;
}
