// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import ActionResultSummary from './ActionResultSummary';

const tacticalSource=readFileSync(new URL('./TacticalBattleScreen.tsx',import.meta.url),'utf8');

describe('V10 action result feedback',()=>{
  it('shows authoritative supplied changes before current totals',()=>{
    const html=renderToStaticMarkup(<ActionResultSummary
      title="훈련 완료"
      changes={[{label:'힘',value:'+3'},{label:'피로',value:'+8'},{label:'Calling 숙련도',value:'+12'}]}
      totals={[{label:'현재 힘',value:'41'},{label:'현재 피로',value:'38'}]}
      continuationLabel="이번 주 계속"
      onContinue={vi.fn()}
    />);
    expect(html.indexOf('힘')).toBeLessThan(html.indexOf('현재 힘'));
    expect(html).toContain('+3');
    expect(html).toContain('이번 주 계속');
  });

  it('renders authoritative result copy without guessing deltas when none are supplied',()=>{
    const html=renderToStaticMarkup(<ActionResultSummary
      title="원정 결과"
      message="기록된 원정 결과를 확인하세요."
      continuationLabel="지도로 돌아가기"
      onContinue={vi.fn()}
    />);
    expect(html).toContain('기록된 원정 결과를 확인하세요.');
    expect(html).not.toContain('v10-result-change-list');
  });

  it('routes Tactical terminal feedback through the shared result summary while preserving retry',()=>{
    expect(tacticalSource).toContain("from './ActionResultSummary'");
    expect(tacticalSource).toContain('<ActionResultSummary');
    expect(tacticalSource).toContain("continuationLabel={onExit?'홈으로 돌아가기':'다시 도전'}");
    expect(tacticalSource).toContain('>다시 도전</button>');
    expect(tacticalSource).toContain('onRetry');
    expect(tacticalSource).toContain('onExit');
  });
});
