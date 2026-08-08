import { describe, expect, it } from 'vitest';
import { archiveRank, archiveRankDefinitions } from './collection-archive-rank';

describe('growth archive rank', () => {
  it('preserves the original milestones and adds expedition archive ranks', () => {
    expect(archiveRankDefinitions.map(item => [item.id, item.required])).toEqual([
      ['keeper', 10],
      ['collector', 25],
      ['chronicler', 40],
      ['master', 50],
      ['expedition_archivist', 75],
      ['chronicle_complete', 100],
    ]);
  });

  it('returns the highest reached archive rank with next milestone progress', () => {
    expect(archiveRank(0)).toMatchObject({ id:'newcomer', current:0, next:{ required:10, remaining:10 } });
    expect(archiveRank(25)).toMatchObject({ id:'collector', current:25, next:{ required:40, remaining:15 } });
    expect(archiveRank(50)).toMatchObject({ id:'master', current:50, next:{ required:75, remaining:25 } });
    expect(archiveRank(74)).toMatchObject({ id:'master', current:74, next:{ required:75, remaining:1 } });
    expect(archiveRank(75)).toMatchObject({ id:'expedition_archivist', current:75, next:{ required:100, remaining:25 } });
  });

  it('awards the final guardian chronicle honor only at one hundred slots', () => {
    expect(archiveRank(99)).toMatchObject({ id:'expedition_archivist', current:99, next:{ required:100, remaining:1 } });
    expect(archiveRank(100)).toMatchObject({ id:'chronicle_complete', label:'수호 연대기의 완성자', current:100, next:null });
    expect(archiveRank(999)).toMatchObject({ id:'chronicle_complete', current:100, next:null });
  });
});
