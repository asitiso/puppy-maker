// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');

describe('V18 in-world environment puzzle integration',()=>{
  it('keeps the puzzle inside the exploration field rather than routing to a puzzle screen',()=>{
    expect(slice).toContain('stepRuinPuzzle');
    expect(slice).toContain('STARTING_RUIN_PUZZLE');
    expect(slice).toContain("castEnvironmentAbility('windPulse')");
    expect(slice).toContain("castEnvironmentAbility('emberSpark')");
    expect(slice).not.toMatch(/PuzzleScreen|OPEN_PUZZLE|puzzle route/i);
  });

  it('uses contextual environment controls instead of permanent quest UI',()=>{
    expect(slice).toContain('nearPuzzle&&!combatEngaged&&!defeated');
    expect(slice).toContain('바람밀기');
    expect(slice).toContain('불씨점화');
    expect(slice).toContain('공명석 밀기');
    expect(slice).toContain('공명핵 회수');
  });

  it('turns the puzzle reward into new exploration information',()=>{
    expect(slice).toContain('echoSenseRef.current=true');
    expect(slice).toContain('메아리 감각');
    expect(renderer).toContain("discovery.kind==='secret'&&!echoSenseUnlocked");
  });

  it('renders physical plates stone brazier and reward in the same perspective renderer',()=>{
    expect(renderer).toContain('drawRuinPuzzle');
    expect(renderer).toContain('state.westPlateActive');
    expect(renderer).toContain('state.eastPlateActive');
    expect(renderer).toContain('state.stonePosition');
    expect(renderer).toContain('state.brazierLit');
    expect(renderer).toContain('state.rewardClaimed');
  });
});
