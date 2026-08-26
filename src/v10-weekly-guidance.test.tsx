import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import {weeklyFocusRecommendations} from './weekly-focus-guidance';
import {weeklyFocusIds} from './weekly-life';

const tiredState={...initialState,condition:'tired' as const};

describe('V10 Weekly recommendation hierarchy',()=>{
  it('recommends recovery only from a factual tired-state signal',()=>{
    expect(weeklyFocusRecommendations(tiredState)).toContainEqual(expect.objectContaining({focus:'rest'}));
    expect(weeklyFocusRecommendations({...initialState,condition:'normal'})).not.toContainEqual(expect.objectContaining({focus:'rest'}));
  });

  it('keeps all seven choices while surfacing recommendations above the ordinary grid',()=>{
    const html=renderToStaticMarkup(<WeeklyPlannerCard state={tiredState} onSelectFocus={vi.fn()} onComplete={vi.fn()} onAdvance={vi.fn()} showChronicles={false}/>);
    expect(html).toContain('v10-weekly-recommendations');
    expect(html.indexOf('v10-weekly-recommendations')).toBeLessThan(html.indexOf('weekly-focus-grid'));
    for(const focus of weeklyFocusIds)expect(html).toContain(`data-weekly-focus="${focus}"`);
  });
});
