import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import MobileLegacyFeaturePage from './MobileLegacyFeaturePage';
import type {MobileFeatureId} from './mobile-router';

function render(feature:MobileFeatureId){
  return renderToStaticMarkup(<MobileLegacyFeaturePage
    feature={feature}
    state={initialState}
    onClaimAchievement={vi.fn()}
    onOuting={vi.fn()}
    onGift={vi.fn()}
    onAttendance={vi.fn()}
    onMail={vi.fn()}
    onMonthlyFocus={vi.fn()}
  />);
}

describe('V8 routed legacy features',()=>{
  it('renders achievements as a page with no home-reset backdrop',()=>{
    const html=render('achievements');
    expect(html).toContain('성장 업적');
    expect(html).toContain('v8-feature-page');
    expect(html).not.toContain('lh-panel-backdrop');
    expect(html).not.toContain('aria-label="홈으로 돌아가기"');
  });

  it('renders attendance, mail and mission as ordinary routed pages',()=>{
    expect(render('attendance')).toContain('월간 출석');
    expect(render('mail')).toContain('우편함');
    expect(render('mission')).toContain('이번 달 도전');
  });

  it('renders inventory, outing, bond and stories without modal trapping',()=>{
    expect(render('inventory')).toContain('능력과 보유품');
    expect(render('gifts')).toContain('선물');
    expect(render('outing')).toContain('외출');
    expect(render('bond')).toContain('루나와의 교감');
    expect(render('stories')).toContain('루나 이야기');
    for(const feature of ['inventory','gifts','outing','bond','stories'] as const){
      expect(render(feature)).not.toContain('role="dialog"');
    }
  });
});
