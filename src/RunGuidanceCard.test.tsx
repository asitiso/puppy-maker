import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import RunGuidanceCard from './RunGuidanceCard';
import type {RunGuidanceView} from './run-guidance';

const base:RunGuidanceView={
  mode:'active_run',
  eyebrow:'가을 · 2회차',
  title:'True Path 여정 진행 중',
  body:'여러 삶에서 이어진 단서가 하나의 길로 연결되고 있습니다.',
  nextAction:'가을의 다음 목표 진행하기',
  campaignLabel:'True Path',
  seasonLabel:'가을',
  routeTone:'true',
};

describe('RunGuidanceCard',()=>{
  it('renders semantic journey context as an accessible home landmark',()=>{
    const html=renderToStaticMarkup(<RunGuidanceCard guidance={base}/>);
    expect(html).toContain('aria-label="현재 여정 안내"');
    expect(html).toContain('data-route-tone="true"');
    expect(html).toContain('True Path 여정 진행 중');
    expect(html).toContain('가을의 다음 목표 진행하기');
  });

  it('supports Hollow and returning-run tones without hidden internals',()=>{
    const view:RunGuidanceView={
      ...base,
      mode:'returning_run',
      eyebrow:'NEW POSSIBILITY · 3회차',
      title:'다시 시작된 봄, 달라진 가능성',
      body:'지난 기록은 남아 있지만 이번 선택은 새로 시작됩니다.',
      nextAction:'봄의 일상에서 새로운 길 찾기',
      campaignLabel:'아직 선택 전',
      seasonLabel:'봄',
      routeTone:'hollow',
      recentResult:'2회차 True Path · Costly Victory',
    };
    const html=renderToStaticMarkup(<RunGuidanceCard guidance={view}/>);
    expect(html).toContain('data-route-tone="hollow"');
    expect(html).toContain('2회차 True Path');
    expect(html).not.toMatch(/hollow_candidate|dangerState|score|threshold|affinity/i);
  });

  it('keeps long Korean guidance intact instead of adding truncation metadata',()=>{
    const html=renderToStaticMarkup(<RunGuidanceCard guidance={{...base,body:'아주 긴 한국어 안내 문장도 작은 화면에서 줄바꿈되어 현재 목표와 다음 행동을 잃지 않도록 그대로 보여줍니다.'}}/>);
    expect(html).toContain('아주 긴 한국어 안내 문장');
    expect(html).not.toContain('title=');
    expect(html).not.toContain('aria-hidden="true"');
  });
});
