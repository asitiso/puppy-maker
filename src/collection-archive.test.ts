import { describe, expect, it } from 'vitest';
import { collectionArchive } from './collection-archive';

describe('growth collection archive', () => {
  it('summarizes eight long-term collection categories', () => {
    const archive = collectionArchive({ memories:3, discoveries:2, stories:1, talents:4, titles:2, seasonStamps:2, legacyRelics:1, ambitionHonors:2 });
    expect(archive.categories).toEqual([
      { id:'memories', label:'기억', current:3, total:13 },
      { id:'discoveries', label:'발견물', current:2, total:6 },
      { id:'stories', label:'이야기', current:1, total:5 },
      { id:'talents', label:'고급 재능', current:4, total:8 },
      { id:'titles', label:'칭호', current:2, total:6 },
      { id:'seasonStamps', label:'계절 인장', current:2, total:4 },
      { id:'legacyRelics', label:'레거시 유물', current:1, total:5 },
      { id:'ambitionHonors', label:'야망 휘장', current:2, total:3 },
    ]);
    expect(archive.total).toBe(50);
  });

  it('calculates one stable overall completion percentage', () => {
    expect(collectionArchive({ memories:13, discoveries:6, stories:5, talents:8, titles:6, seasonStamps:4, legacyRelics:5, ambitionHonors:3 }).percent).toBe(100);
    expect(collectionArchive({ memories:0, discoveries:0, stories:0, talents:0, titles:0, seasonStamps:0, legacyRelics:0, ambitionHonors:0 }).percent).toBe(0);
  });

  it('clamps malformed counts to each category total', () => {
    const archive = collectionArchive({ memories:99, discoveries:-2, stories:8, talents:8, titles:6, seasonStamps:9, legacyRelics:99, ambitionHonors:99 });
    expect(archive.categories.map(item => item.current)).toEqual([13,0,5,8,6,4,5,3]);
    expect(archive.percent).toBe(88);
  });
});
