// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import InformationSheet from './InformationSheet';

const layeredHomeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');

const metrics=[
  {label:'돌봄',value:'1/2'},
  {label:'놀이',value:'2/2'},
];

describe('V11 shared information sheet',()=>{
  it('renders summary before detail with one dominant primary action',()=>{
    const html=renderToStaticMarkup(
      <InformationSheet
        open
        title="오늘의 목표"
        summary="오늘 진행 상황"
        metrics={metrics}
        detail="완료하지 않은 목표를 먼저 확인하세요."
        primaryAction={{label:'도전과제 보기',onClick:vi.fn()}}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html.indexOf('오늘 진행 상황')).toBeLessThan(html.indexOf('완료하지 않은 목표'));
    expect((html.match(/data-information-action="primary"/g)??[]).length).toBe(1);
  });

  it('limits secondary actions and exposes progressive disclosure semantics',()=>{
    const html=renderToStaticMarkup(
      <InformationSheet
        open
        title="컬렉션"
        summary="보상과 기록"
        detail="긴 설명"
        detailLabel="자세히 보기"
        detailExpanded={false}
        onDetailToggle={vi.fn()}
        primaryAction={{label:'컬렉션 보러가기',onClick:vi.fn()}}
        secondaryActions={[
          {label:'최근 기록',onClick:vi.fn()},
          {label:'완료 기록',onClick:vi.fn()},
          {label:'초과 액션',onClick:vi.fn()},
        ]}
        onClose={vi.fn()}
      />,
    );

    expect(html).toContain('aria-expanded="false"');
    expect((html.match(/data-information-action="secondary"/g)??[]).length).toBeLessThanOrEqual(2);
    expect(html).not.toContain('초과 액션');
  });

  it('is consumed by the quest and collection home panels instead of duplicated sheet markup',()=>{
    expect(layeredHomeSource).toContain("from './InformationSheet'");
    expect((layeredHomeSource.match(/<InformationSheet/g)??[]).length).toBeGreaterThanOrEqual(2);
  });
});
