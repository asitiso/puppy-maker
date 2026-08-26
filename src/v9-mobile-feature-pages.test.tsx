// @ts-ignore -- Vitest source contracts execute with Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {attendanceKey} from './attendance';
import {initialState,type GameState} from './game';
import MobileLegacyFeaturePage from './MobileLegacyFeaturePage';
import type {MobileFeatureId} from './mobile-router';

const source=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

function render(feature:MobileFeatureId,state:GameState=initialState){
  return renderToStaticMarkup(<MobileLegacyFeaturePage
    feature={feature}
    state={state}
    onBack={vi.fn()}
    onClaimAchievement={vi.fn()}
    onOuting={vi.fn()}
    onGift={vi.fn()}
    onAttendance={vi.fn()}
    onMail={vi.fn()}
    onMonthlyFocus={vi.fn()}
  />);
}

describe('V9 ordinary feature pages',()=>{
  it('gives ordinary features one shared page shell and one contextual back control',()=>{
    for(const feature of ['achievements','attendance','mail','gifts','outing'] as const){
      const html=render(feature);
      expect(html).toContain('data-mobile-page-shell');
      expect((html.match(/v9-page-back/g)??[]).length).toBe(1);
      expect((html.match(/data-mobile-page-scroll/g)??[]).length).toBe(1);
    }
  });

  it('shows explicit reasons for completed, locked and unavailable actions',()=>{
    const claimedAttendance={...initialState,claimedAttendanceMonths:[attendanceKey(initialState.year,initialState.month)]};
    expect(render('attendance',claimedAttendance)).toContain('수령 완료');
    expect(render('mail')).toContain('조건을 달성하면');
    const noGifts={...initialState,inventory:{star_cookie:0,herb_tea:0,fox_charm:0}};
    expect(render('gifts',noGifts)).toContain('보유한 선물이 없어요');
  });

  it('uses the shared action and feedback primitives without modal feedback',()=>{
    expect(source).toContain('MobilePrimaryAction');
    expect(source).toContain('MobileFeedback');
    expect(source).toContain('disabledReason');
    expect(source).toContain('setFeedback');
    expect(source).not.toContain('role="dialog"');
  });

  it('keeps the existing authoritative callbacks as the only mutation path',()=>{
    for(const callback of ['onClaimAchievement','onOuting','onGift','onAttendance','onMail','onMonthlyFocus'])expect(source).toContain(callback);
    expect(source).not.toContain("dispatch({type:");
  });
});
