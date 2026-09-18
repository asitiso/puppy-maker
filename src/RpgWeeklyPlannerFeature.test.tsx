import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import RpgWeeklyPlannerFeature from './RpgWeeklyPlannerFeature';

describe('RPG weekly planner facility',()=>{
  it('renders the canonical weekly planner inside a dedicated facility interior',()=>{
    const html=renderToStaticMarkup(<RpgWeeklyPlannerFeature
      state={initialState}
      onBack={vi.fn()}
      onWeeklyFocus={vi.fn()}
      onCompleteWeek={vi.fn()}
      onAdvanceWeek={vi.fn()}
    />);
    expect(html).toContain('주간 작전판');
    expect(html).toContain('이번 주 계획');
    for(const label of ['훈련','휴식','외출','관계','세계','전투','시즌']) expect(html).toContain(label);
    expect(html).toContain('v9-page-back');
  });
});
