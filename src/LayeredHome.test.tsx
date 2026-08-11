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

describe('LayeredHome hierarchy',()=>{
  it('surfaces essential status and current progression',()=>{
    const html=render();
    expect(html).toContain('4월 2주차');
    expect(html).toContain('82 / 100');
    expect(html).toContain('성장 컬렉션');
    expect(html).toContain('루나 이야기');
    expect(html).toContain('성장 업적');
  });
  it('keeps the full raising navigation available',()=>{
    const html=render();
    expect(html).toContain('>스케줄<');
    expect(html).toContain('>가방<');
    expect(html).toContain('>퀘스트<');
    expect(html).toContain('>외출<');
    expect(html).toContain('>교감<');
  });
  it('uses condition-aware contextual guidance',()=>{
    const html=render({...initialState,condition:'tired'});
    expect(html).toContain('오늘은 휴식을 넣거나 호숫가에 다녀오는 게 좋아요.');
  });
  it('surfaces collection counts from the integrated state',()=>{
    const html=render({...initialState,discoveries:['moon_feather','star_mushroom']});
    expect(html).toContain('발견물 <b>2 / 6</b>');
  });
});
