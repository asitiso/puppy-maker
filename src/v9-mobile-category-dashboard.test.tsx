// @ts-ignore -- Vitest source contracts execute with Node globals outside app tsconfig.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState,type GameState} from './game';
import MobileCategoryPage from './MobileCategoryPage';
import {categoryForFeature,type MobileContentCategory} from './mobile-router';
import {mobileCategoryRecommendation} from './mobile-category-guidance';
import {attendanceKey} from './attendance';

const source=readFileSync(new URL('./MobileCategoryPage.tsx',import.meta.url),'utf8');

function state(patch:Partial<GameState>={}):GameState{
  return {...initialState,...patch};
}

function renderCategory(category:MobileContentCategory,current=initialState){
  return renderToStaticMarkup(<MobileCategoryPage
    category={category}
    state={current}
    onOpenFeature={vi.fn()}
    onWeeklyFocus={vi.fn()}
    onCompleteWeek={vi.fn()}
    onAdvanceWeek={vi.fn()}
  />);
}

describe('V9 recommendation-first category dashboards',()=>{
  it('prioritizes unclaimed attendance before the ordinary life schedule',()=>{
    const recommendation=mobileCategoryRecommendation('life',initialState);
    expect(recommendation.feature).toBe('attendance');
    expect(categoryForFeature[recommendation.feature]).toBe('life');

    const claimed=state({claimedAttendanceMonths:[attendanceKey(initialState.year,initialState.month)]});
    expect(categoryForFeature[mobileCategoryRecommendation('life',claimed).feature]).toBe('life');
  });

  it('prioritizes a claimable growth achievement and an available bond gift',()=>{
    const growth=state({memories:['first_training']});
    expect(mobileCategoryRecommendation('growth',growth).feature).toBe('achievements');
    expect(mobileCategoryRecommendation('bond',initialState).feature).toBe('gifts');
  });

  it('never recommends a feature outside the active category',()=>{
    for(const category of ['life','growth','adventure','bond','records'] as const){
      const recommendation=mobileCategoryRecommendation(category,initialState);
      expect(categoryForFeature[recommendation.feature]).toBe(category);
    }
  });

  it('renders every category through MobilePageShell with one recommendation hero and no category back button',()=>{
    for(const category of ['life','growth','adventure','bond','records'] as const){
      const html=renderCategory(category);
      expect(html).toContain('data-mobile-page-shell');
      expect(html).toContain('v9-category-recommendation');
      expect(html).not.toContain('v9-page-back');
      expect(html).toContain(`data-visual-slot="category.${category}.background"`);
    }
    expect(source).toContain('MobilePageShell');
    expect(source).toContain('mobileCategoryRecommendation');
  });

  it('keeps records action-first by placing archive before expandable chronicles',()=>{
    const html=renderCategory('records');
    expect(html.indexOf('성장 도감')).toBeGreaterThan(-1);
    expect(html.indexOf('가문 연대기')).toBeGreaterThan(html.indexOf('성장 도감'));
    expect(html).toContain('<details');
    expect(html).toContain('세계 연대기');
  });
});
