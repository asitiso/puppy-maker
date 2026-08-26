import {describe,expect,it} from 'vitest';
import {guidedActionStack,type GuidedAction} from './guided-actions';

const action=(overrides:Partial<GuidedAction>&Pick<GuidedAction,'id'|'route'|'priority'>):GuidedAction=>({
  domain:'schedule',
  label:overrides.id,
  detail:`${overrides.id} detail`,
  state:'ready',
  ...overrides,
});

describe('V10 guided action stack',()=>{
  it('chooses the highest-priority action as primary and caps secondary actions at two',()=>{
    const stack=guidedActionStack([
      action({id:'schedule',route:'schedule',priority:10}),
      action({id:'weekly',domain:'weekly',route:'weekly_planner',priority:70}),
      action({id:'mail',domain:'reward',route:'mail',priority:100}),
      action({id:'world',domain:'world',route:'expedition',priority:60}),
    ]);

    expect(stack.primary.id).toBe('mail');
    expect(stack.secondary.map(item=>item.id)).toEqual(['weekly','world']);
  });

  it('prefers distinct routes when a duplicate route can be skipped',()=>{
    const stack=guidedActionStack([
      action({id:'training',domain:'raising',route:'schedule',priority:80}),
      action({id:'rest',domain:'raising',route:'schedule',priority:79}),
      action({id:'world',domain:'world',route:'expedition',priority:70}),
      action({id:'season',domain:'season',route:'season',priority:60}),
    ]);

    expect(stack.primary.id).toBe('training');
    expect(stack.secondary.map(item=>item.id)).toEqual(['world','season']);
  });

  it('preserves blocked guidance and never invents a resolution route',()=>{
    const withResolution=action({
      id:'blocked-week',
      domain:'weekly',
      route:'schedule',
      priority:80,
      state:'blocked',
      reason:'이번 주 계획을 먼저 선택하세요.',
      resolveRoute:'weekly_planner',
    });
    const withoutResolution=action({
      id:'blocked-world',
      domain:'world',
      route:'expedition',
      priority:70,
      state:'blocked',
      reason:'필요한 조건이 아직 충족되지 않았어요.',
    });

    const stack=guidedActionStack([withResolution,withoutResolution]);

    expect(stack.primary.reason).toBe('이번 주 계획을 먼저 선택하세요.');
    expect(stack.primary.resolveRoute).toBe('weekly_planner');
    expect(stack.secondary[0].reason).toBe('필요한 조건이 아직 충족되지 않았어요.');
    expect(stack.secondary[0].resolveRoute).toBeUndefined();
  });
});
