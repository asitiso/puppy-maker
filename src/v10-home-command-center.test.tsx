// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import HomeCommandCenter from './HomeCommandCenter';
import type {GuidedActionStack} from './guided-actions';

const layeredHomeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');

const stack:GuidedActionStack={
  primary:{id:'mail',domain:'reward',label:'받을 편지가 있어요',detail:'보상을 먼저 확인하세요.',route:'mail',priority:100,state:'ready'},
  secondary:[
    {id:'attendance',domain:'reward',label:'출석 보상 받기',detail:'이번 달 보상을 받을 수 있어요.',route:'attendance',priority:95,state:'ready'},
    {id:'blocked-world',domain:'world',label:'원정 준비',detail:'월드 진행을 확인하세요.',route:'expedition',priority:60,state:'blocked',reason:'이번 주 계획을 먼저 선택하세요.',resolveRoute:'weekly_planner'},
  ],
};

describe('V10 Home Command Center',()=>{
  it('renders exactly one primary action and at most two secondary actions',()=>{
    const html=renderToStaticMarkup(<HomeCommandCenter stack={stack} onAction={vi.fn()}/>);
    expect((html.match(/data-guided-variant="primary"/g)??[]).length).toBe(1);
    expect((html.match(/data-guided-variant="secondary"/g)??[]).length).toBeLessThanOrEqual(2);
    expect(html).toContain('받을 편지가 있어요');
    expect(html).toContain('보상을 먼저 확인하세요.');
  });

  it('shows blocked reason and an explicit resolution affordance',()=>{
    const html=renderToStaticMarkup(<HomeCommandCenter stack={stack} onAction={vi.fn()}/>);
    expect(html).toContain('이번 주 계획을 먼저 선택하세요.');
    expect(html).toContain('해결하러 가기');
  });

  it('is actually consumed by LayeredHome instead of remaining an orphan component',()=>{
    expect(layeredHomeSource).toContain("from './HomeCommandCenter'");
    expect(layeredHomeSource).toContain('hubGuidedActionStack');
    expect(layeredHomeSource).toContain('<HomeCommandCenter');
  });
});
