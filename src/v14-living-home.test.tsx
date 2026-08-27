import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import LayeredHome from './LayeredHome';
import {initialState} from './game';

const callbacks={
  onSchedule:vi.fn(),
  onClaimAchievement:vi.fn(),
  onOuting:vi.fn(),
  onGift:vi.fn(),
  onAttendance:vi.fn(),
  onMail:vi.fn(),
  onMonthlyFocus:vi.fn(),
};

const render=(state=initialState)=>renderToStaticMarkup(<LayeredHome state={state} {...callbacks}/>);

describe('V14 living home',()=>{
  it('adds anchored room interactions without removing existing quick access',()=>{
    const html=render();
    expect(html).toContain('data-location="home"');
    expect(html).toContain('data-interaction-id="bed"');
    expect(html).toContain('data-interaction-id="door"');
    expect(html).toContain('>스케줄<');
    expect(html).toContain('>가방<');
  });

  it('resolves tired Runa into the living-scene presentation state',()=>{
    const html=render({...initialState,condition:'tired'});
    expect(html).toContain('data-actor-id="runa"');
    expect(html).toContain('data-pose="tired"');
  });
});
