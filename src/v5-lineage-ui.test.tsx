// @ts-ignore -- Vitest executes this source contract in Node; keep Node types out of app dependencies.
import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import LineageChronicle from './LineageChronicle';
import {initialState,type GameState} from './game';

function lineageState():GameState{
  return {
    ...initialState,
    year:2,
    lineage:{
      generation:3,
      heritageTraits:['warm_heart','world_witness'],
      ancestors:[
        {generation:1,yearsLived:3,route:'caretaker',ending:'v3:caretaker:bond:world:career',guardianRank:'guardian',personalityKey:'kindness',majorWorldFacts:['festival_saved'],heritageTraits:['warm_heart']},
        {generation:2,yearsLived:4,route:'hollow',ending:'v3:hollow:bond:world:career',guardianRank:'veteran',personalityKey:'calmness',majorWorldFacts:['regional_alliance'],heritageTraits:['arcane_echo','hollow_echo']},
      ],
    },
  } as GameState;
}

describe('V5 lineage chronicle UI',()=>{
  it('shows generation identity, life stage, bounded heritage and recent ancestors',()=>{
    const html=renderToStaticMarkup(<LineageChronicle state={lineageState()} />);
    expect(html).toContain('가문 연대기');
    expect(html).toContain('3세대 · 2년차');
    expect(html).toContain('청년 수호자');
    expect(html).toContain('따뜻한 혈통');
    expect(html).toContain('세계의 증인');
    expect(html).toContain('2세대');
    expect(html).toContain('Hollow Path');
  });

  it('offers an explicit next-generation action only after the mature-life gate',()=>{
    const onStart=vi.fn();
    const immature=renderToStaticMarkup(<LineageChronicle state={lineageState()} onStartNextGeneration={onStart}/>);
    expect(immature).not.toContain('다음 세대 시작');

    const mature={...lineageState(),year:3,resolvedEnding:'v3:caretaker:bond:world:career'} as GameState;
    const ready=renderToStaticMarkup(<LineageChronicle state={mature} onStartNextGeneration={onStart}/>);
    expect(ready).toContain('다음 세대 시작');
    expect(ready).toContain('새 삶은 능력치가 아니라 기억을 이어받아요.');
  });

  it('mounts inside the visible weekly overlay and bridges requests into the authoritative App reducer',()=>{
    const appSource=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
    const plannerSource=readFileSync(new URL('./WeeklyPlannerCard.tsx',import.meta.url),'utf8');
    const homeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');
    expect(appSource).toContain('nextGenerationRequestEvent');
    expect(appSource).toContain("dispatch({type:'START_NEXT_GENERATION'})");
    expect(plannerSource).toContain("import LineageChronicle from './LineageChronicle';");
    expect(plannerSource).toContain('<LineageChronicle state={state}/>');
    expect(homeSource).toContain('const guidedActions = hubGuidedActionStack(state);');
    expect((homeSource.match(/<HomeCommandCenter/g)??[])).toHaveLength(1);
  });

  it('keeps mobile, touch, safe-area and reduced-motion contracts',()=>{
    const css=readFileSync(new URL('./lineage-chronicle.css',import.meta.url),'utf8');
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('safe-area-inset-right');
  });
});
