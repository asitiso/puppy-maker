import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import RpgHomeHub from './RpgHomeHub';

describe('RPG home hub',()=>{
  it('renders the player-facing world destinations instead of a card menu',()=>{
    const html=renderToStaticMarkup(<RpgHomeHub state={initialState} onCategory={vi.fn()} onFeature={vi.fn()}/>);
    for(const label of [
      '생활관 · 일정과 휴식',
      '수련장 · 성장과 장비',
      '월드 게이트 · 지역 탐험',
      '원정 게시판 · 전투 준비',
      '인연 정원 · 대화와 선물',
      '기록관 · 연대기와 업적',
    ]) expect(html).toContain(label);
    expect(html).toContain('별빛 마을 월드 허브');
    expect(html).toContain('PLAYER · LUNA');
    expect(html).toContain('>HP<');
    expect(html).toContain('>MP<');
    expect(html).toContain('메인 퀘스트');
    expect(html).not.toContain('별빛 마을 탐험 종료');
  });
});
