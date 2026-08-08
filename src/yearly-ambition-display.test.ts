import { describe, expect, it } from 'vitest';
import { ambitionDisplay } from './yearly-ambition-display';

describe('yearly ambition home display', () => {
  it('asks the player to choose when this year has no ambition', () => {
    expect(ambitionDisplay(null, null)).toEqual({ mode:'choose', label:'올해의 야망을 선택하세요', detail:'한 해의 플레이 방향이 달라져요.' });
  });

  it('shows remaining progress while an ambition is active', () => {
    expect(ambitionDisplay({ id:'training', label:'별을 넘는 훈련', description:'훈련', target:30 }, { current:12, target:30, percent:40, complete:false }))
      .toEqual({ mode:'progress', label:'별을 넘는 훈련', detail:'18 남음 · 40%' });
  });

  it('celebrates completion without overflowing past 100 percent', () => {
    expect(ambitionDisplay({ id:'season', label:'사계의 수호자', description:'사계', target:4 }, { current:4, target:4, percent:100, complete:true }))
      .toEqual({ mode:'complete', label:'사계의 수호자', detail:'올해의 야망 달성!' });
  });
});
