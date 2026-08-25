import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import {initialState} from './game';
import {emptyWeeklyLifeState,selectWeeklyFocus} from './weekly-life';
import {weekKey} from './weekly-calendar';

const callbacks={onSelectFocus:vi.fn(),onComplete:vi.fn(),onAdvance:vi.fn()};
const render=(state=initialState)=>renderToStaticMarkup(<WeeklyPlannerCard state={state} {...callbacks}/>);

describe('WeeklyPlannerCard',()=>{
  it('shows the canonical date, all seven focus choices and living NPC presence before selection',()=>{
    const html=render();
    expect(html).toContain(`${initialState.year}년차 ${initialState.month}월 ${initialState.week}주차`);
    for(const label of ['훈련','휴식','외출','관계','세계','전투','시즌']) expect(html).toContain(label);
    expect(html).toContain('이번 주 만남');
    expect(html).toContain('노아');
    expect(html).toContain('에이든');
  });

  it('shows the selected focus and deterministic event teaser with one resolve action',()=>{
    const key=weekKey(initialState.year,initialState.month,initialState.week);
    const weeklyLife=selectWeeklyFocus(emptyWeeklyLifeState(),key,'world');
    const html=render({...initialState,weeklyLife});
    expect(html).toContain('선택됨 · 세계');
    expect(html).toContain('수호대 순찰');
    expect(html).toContain('이번 주 마무리');
    expect(html).not.toContain('다음 주 시작');
  });

  it('switches to the next-week action after the current week is resolved',()=>{
    const key=weekKey(initialState.year,initialState.month,initialState.week);
    const weeklyLife={...selectWeeklyFocus(emptyWeeklyLifeState(),key,'rest'),completedWeekKey:key,lastEvent:'quiet_rain' as const,resolvedEventKeys:[`${key}:quiet_rain`]};
    const html=render({...initialState,weeklyLife});
    expect(html).toContain('이번 주 완료');
    expect(html).toContain('다음 주 시작');
    expect(html).not.toContain('이번 주 마무리');
  });

  it('marks the panel as an accessible weekly region and keeps controls button-based',()=>{
    const html=render();
    expect(html).toContain('aria-label="이번 주 계획"');
    expect(html).toContain('class="weekly-focus-grid"');
    expect((html.match(/<button/g)??[]).length).toBeGreaterThanOrEqual(7);
  });
});
