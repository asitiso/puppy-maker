import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import MobileCategoryPage from './MobileCategoryPage';
import type {MobileContentCategory} from './mobile-router';

function render(category:MobileContentCategory){
  return renderToStaticMarkup(<MobileCategoryPage
    category={category}
    state={initialState}
    onOpenFeature={vi.fn()}
    onWeeklyFocus={vi.fn()}
    onCompleteWeek={vi.fn()}
    onAdvanceWeek={vi.fn()}
  />);
}

describe('V8 full-page categories',()=>{
  it('renders categories as route pages rather than backdrop sheets',()=>{
    const html=render('life');
    expect(html).toContain('v8-category-page');
    expect(html).toContain('v8-category-header');
    expect(html).not.toContain('v7-category-backdrop');
    expect(html).not.toContain('role="dialog"');
  });

  it('maps life features and weekly planner into the 생활 page',()=>{
    const html=render('life');
    for(const label of ['이번 주 계획','스케줄','이번 달 목표','출석 보상','우편함'])expect(html).toContain(label);
  });

  it('maps growth and adventure features into clear pages',()=>{
    const growth=render('growth');
    for(const label of ['성장 정체성','올해의 야망','성장 업적','능력과 보유품','시즌 여정','별빛 성소'])expect(growth).toContain(label);
    const adventure=render('adventure');
    for(const label of ['외출','수호자 원정','월드 진행','세계 프로젝트'])expect(adventure).toContain(label);
  });

  it('maps bond and records content without nested full-screen sheets',()=>{
    const bond=render('bond');
    for(const label of ['루나와 교감','선물','이야기'])expect(bond).toContain(label);
    const records=render('records');
    for(const label of ['가문 연대기','세계 연대기','성장 도감','발견과 기억'])expect(records).toContain(label);
    expect(records).not.toContain('v7-category-sheet');
  });
});
