import { describe, expect, it } from 'vitest';
import {
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  type TacticalScenarioResult,
  type TacticalTerminalHandoffState,
} from './tactical-scenario';

const result=(attemptKey:string):TacticalScenarioResult=>({
  scenarioId:'spring-vanguard-terminal',
  campaign:'vanguard',
  attemptKey,
  terminalKey:`spring-vanguard-terminal:${attemptKey}`,
  objectiveResult:'success',
  battleResult:'victory',
  failForward:false,
  rounds:4,
  survivingAllies:2,
  damageTaken:37,
});

describe('V3 Tactical once-only terminal handoff',()=>{
  it('starts with an isolated empty handoff state',()=>{
    const first=createTacticalTerminalHandoffState();
    const second=createTacticalTerminalHandoffState();
    expect(first).toEqual({handedOffKeys:[]});
    expect(second).toEqual({handedOffKeys:[]});
    expect(first).not.toBe(second);
    expect(first.handedOffKeys).not.toBe(second.handedOffKeys);
  });

  it('passes a terminal result exactly once for its terminal key',()=>{
    const state=createTacticalTerminalHandoffState();
    const terminal=result('attempt-1');
    const first=handoffTacticalTerminalResult(state,terminal);

    expect(first.result).toEqual(terminal);
    expect(first.result).not.toBe(terminal);
    expect(first.state).toEqual({handedOffKeys:['spring-vanguard-terminal:attempt-1']});
    expect(first.state).not.toBe(state);
    expect(state).toEqual({handedOffKeys:[]});

    const duplicate=handoffTacticalTerminalResult(first.state,terminal);
    expect(duplicate.result).toBeNull();
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.state.handedOffKeys).toEqual(['spring-vanguard-terminal:attempt-1']);
  });

  it('allows a different attempt key to hand off once independently',()=>{
    const first=handoffTacticalTerminalResult(createTacticalTerminalHandoffState(),result('attempt-1'));
    const second=handoffTacticalTerminalResult(first.state,result('attempt-2'));
    expect(second.result?.attemptKey).toBe('attempt-2');
    expect(second.state.handedOffKeys).toEqual([
      'spring-vanguard-terminal:attempt-1',
      'spring-vanguard-terminal:attempt-2',
    ]);
  });

  it('does nothing for a non-terminal null result',()=>{
    const state=createTacticalTerminalHandoffState();
    const handed=handoffTacticalTerminalResult(state,null);
    expect(handed).toEqual({state,result:null});
    expect(handed.state).toBe(state);
  });

  it('sanitizes malformed runtime handoff keys so blanks and duplicates cannot poison dedupe',()=>{
    const corrupted={handedOffKeys:['','  ','spring-vanguard-terminal:attempt-1','spring-vanguard-terminal:attempt-1',42]} as unknown as TacticalTerminalHandoffState;
    const duplicate=handoffTacticalTerminalResult(corrupted,result('attempt-1'));
    expect(duplicate.result).toBeNull();
    expect(duplicate.state.handedOffKeys).toEqual(['spring-vanguard-terminal:attempt-1']);

    const next=handoffTacticalTerminalResult(duplicate.state,result('attempt-2'));
    expect(next.result?.attemptKey).toBe('attempt-2');
    expect(next.state.handedOffKeys).toEqual([
      'spring-vanguard-terminal:attempt-1',
      'spring-vanguard-terminal:attempt-2',
    ]);
  });

  it('rejects a malformed terminal key rather than collapsing different attempts together',()=>{
    const malformed={...result('attempt-1'),terminalKey:'   '};
    expect(()=>handoffTacticalTerminalResult(createTacticalTerminalHandoffState(),malformed)).toThrow('terminal key');
  });

  it('derives once-only identity from scenario and attempt so a tampered terminal key cannot bypass dedupe',()=>{
    const firstInput={...result('attempt-1'),terminalKey:'tampered-key-a'};
    const first=handoffTacticalTerminalResult(createTacticalTerminalHandoffState(),firstInput);
    expect(first.result?.terminalKey).toBe('spring-vanguard-terminal:attempt-1');
    expect(first.state.handedOffKeys).toEqual(['spring-vanguard-terminal:attempt-1']);

    const secondInput={...result('attempt-1'),terminalKey:'tampered-key-b'};
    const duplicate=handoffTacticalTerminalResult(first.state,secondInput);
    expect(duplicate.result).toBeNull();
    expect(duplicate.state).toBe(first.state);
  });
});
