import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import LineageChronicle from './LineageChronicle';
import LayeredHome from './LayeredHome';
import {initialState,type GameState} from './game';

const callbacks={
  onSchedule:vi.fn(),
  onClaimAchievement:vi.fn(),
  onOuting:vi.fn(),
  onGift:vi.fn(),
  onAttendance:vi.fn(),
  onMail:vi.fn(),
  onMonthlyFocus:vi.fn(),
};

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

  it('integrates beside the authoritative Hub CTA instead of becoming a second primary action',()=>{
    const html=renderToStaticMarkup(<LayeredHome state={lineageState()} {...callbacks}/>);
    expect(html).toContain('가문 연대기');
    expect((html.match(/lh-primary-action/g)??[])).toHaveLength(1);

    const homeSource=readFileSync(new URL('./LayeredHome.tsx',import.meta.url),'utf8');
    expect(homeSource).toContain('const primaryTask = hubNextAction(state);');
    expect((homeSource.match(/className="lh-primary-action"/g)??[])).toHaveLength(1);
  });

  it('wires the explicit action through Root and keeps mobile/accessibility contracts',()=>{
    const rootSource=readFileSync(new URL('./Root.tsx',import.meta.url),'utf8');
    const css=readFileSync(new URL('./lineage-chronicle.css',import.meta.url),'utf8');
    expect(rootSource).toContain("dispatch({ type: 'START_NEXT_GENERATION' })");
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('safe-area-inset-right');
  });
});
