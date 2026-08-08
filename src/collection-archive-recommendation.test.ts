import { describe, expect, it } from 'vitest';
import { archiveRecommendation } from './collection-archive-recommendation';
import type { CollectionArchiveCategory } from './collection-archive';

function category(id: CollectionArchiveCategory['id'], label: string, current: number, total: number): CollectionArchiveCategory {
  return { id, label, current, total };
}

describe('growth archive recommendation', () => {
  it('targets the least-complete collection category by completion ratio', () => {
    const result = archiveRecommendation([
      category('memories','기억',6,13),
      category('discoveries','발견물',1,6),
      category('stories','이야기',3,5),
    ]);
    expect(result).toMatchObject({ categoryId:'discoveries', action:'outing', label:'새로운 곳으로 외출' });
  });

  it('maps long-term categories to useful next actions', () => {
    expect(archiveRecommendation([category('ambitionHonors','야망 휘장',0,3)])).toMatchObject({ action:'ambition' });
    expect(archiveRecommendation([category('legacyRelics','레거시 유물',0,5)])).toMatchObject({ action:'annual' });
    expect(archiveRecommendation([category('talents','고급 재능',0,8)])).toMatchObject({ action:'training' });
  });

  it('returns celebration guidance when all categories are complete', () => {
    const result = archiveRecommendation([
      category('memories','기억',13,13),
      category('discoveries','발견물',6,6),
    ]);
    expect(result).toMatchObject({ action:'complete', categoryId:null, label:'수호 연대기 완성' });
  });
});
