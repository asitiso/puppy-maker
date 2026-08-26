import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import InformationPanel from './InformationPanel';
import InformationSheet from './InformationSheet';

const metrics=[
  {label:'돌봄',value:'1/2'},
  {label:'놀이',value:'2/2'},
];

describe('V11 shared information surfaces',()=>{
  it('renders sheet summary before detail with one dominant primary action',()=>{
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

  it('structures an existing panel as summary, state filters, then content',()=>{
    const html=renderToStaticMarkup(
      <InformationPanel
        summaryItems={[
          {label:'진행',value:3},
          {label:'완료',value:7},
        ]}
        filters={[
          {id:'all',label:'전체'},
          {id:'active',label:'진행'},
          {id:'done',label:'완료'},
        ]}
        activeFilter="active"
        onFilterChange={vi.fn()}
      >
        <article>현재 목표</article>
      </InformationPanel>,
    );

    expect(html.indexOf('v11-info-summary')).toBeLessThan(html.indexOf('v11-info-tabs'));
    expect(html.indexOf('v11-info-tabs')).toBeLessThan(html.indexOf('현재 목표'));
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-information-filter="active"');
  });

  it('shows an explicit empty state when a filtered view has no content',()=>{
    const html=renderToStaticMarkup(
      <InformationPanel
        summaryItems={[{label:'완료',value:0}]}
        emptyMessage="완료한 기록이 아직 없어요."
      />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('완료한 기록이 아직 없어요.');
  });
});
