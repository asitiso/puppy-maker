import type { CollectionArchiveCategory, CollectionCategoryId } from './collection-archive';

export type ArchiveRecommendationAction = 'bond' | 'outing' | 'event' | 'training' | 'quest' | 'annual' | 'ambition' | 'complete';

export type ArchiveRecommendation = {
  categoryId: CollectionCategoryId | null;
  action: ArchiveRecommendationAction;
  label: string;
  reason: string;
};

const recommendationByCategory: Record<CollectionCategoryId, Omit<ArchiveRecommendation, 'categoryId'>> = {
  memories: { action:'bond', label:'루나와 교감', reason:'교감과 선물, 함께한 선택이 새로운 기억을 만들어요.' },
  discoveries: { action:'outing', label:'새로운 곳으로 외출', reason:'외출을 반복하면 아직 만나지 못한 발견물을 찾을 수 있어요.' },
  stories: { action:'event', label:'루나 이야기 열기', reason:'관계와 탐험을 이어가며 잠긴 이야기 챕터를 열어보세요.' },
  talents: { action:'training', label:'숙련도 집중 훈련', reason:'훈련 숙련 레벨을 올리면 새로운 고급 재능이 열려요.' },
  titles: { action:'quest', label:'성장 기록 도전', reason:'훈련·탐험·수호 성과를 쌓아 새로운 칭호 조건을 달성하세요.' },
  seasonStamps: { action:'outing', label:'계절 외출 떠나기', reason:'현재 계절에 맞는 장소로 외출해 아직 없는 계절 인장을 노려보세요.' },
  legacyRelics: { action:'annual', label:'한 해를 완주하기', reason:'연간 수호 기록을 쌓을수록 새로운 레거시 유물이 해금돼요.' },
  ambitionHonors: { action:'ambition', label:'올해의 야망 지키기', reason:'선택한 야망을 연속으로 완수하면 장기 명예 휘장이 열려요.' },
};

export function archiveRecommendation(categories: CollectionArchiveCategory[]): ArchiveRecommendation {
  if (!categories.length || categories.every(category => category.total > 0 && category.current >= category.total)) {
    return { categoryId:null, action:'complete', label:'수호 연대기 완성', reason:'모든 성장 흔적을 모았어요. 루나와 만든 50개의 기록이 완성됐습니다.' };
  }

  const incomplete = categories.filter(category => category.total > 0 && category.current < category.total);
  const target = [...incomplete].sort((a, b) => {
    const ratioDiff = (a.current / a.total) - (b.current / b.total);
    if (ratioDiff !== 0) return ratioDiff;
    return categories.indexOf(a) - categories.indexOf(b);
  })[0];
  const recommendation = recommendationByCategory[target.id];
  return { categoryId:target.id, ...recommendation };
}
