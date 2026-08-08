import { describe, expect, it } from 'vitest';
import { archiveRank, archiveRankDefinitions } from './collection-archive-rank';

describe('growth archive rank', () => {
  it('defines four collection milestones across the fifty-slot archive', () => {
    expect(archiveRankDefinitions.map(item => [item.id, item.required])).toEqual([
      ['keeper', 10],
      ['collector', 25],
      ['chronicler', 40],
      ['master', 50],
    ]);
  });

  it('returns the highest reached archive rank with next milestone progress', () => {
    expect(archiveRank(0)).toMatchObject({ id:'newcomer', current:0, next:{ required:10, remaining:10 } });
    expect(archiveRank(25)).toMatchObject({ id:'collector', current:25, next:{ required:40, remaining:15 } });
    expect(archiveRank(49)).toMatchObject({ id:'chronicler', current:49, next:{ required:50, remaining:1 } });
  });

  it('awards the final guardian chronicle honor only at full completion', () => {
    expect(archiveRank(50)).toMatchObject({ id:'master', label:'수호 연대기의 주인', current:50, next:null });
    expect(archiveRank(999)).toMatchObject({ id:'master', current:50, next:null });
  });
});
