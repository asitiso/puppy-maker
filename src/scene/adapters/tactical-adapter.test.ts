import {describe,expect,it} from 'vitest';
import {buildTacticalCompletionAction} from './tactical-adapter';

describe('V14 tactical scene adapter',()=>{
  const result={encounterId:'training_ground',result:'victory',rounds:4,survivingAllies:3,damageTaken:40,companions:['bear','owl']} as const;

  it('builds the existing canonical battle completion action without owning battle logic',()=>{
    expect(buildTacticalCompletionAction(result,false)).toEqual({type:'COMPLETE_TACTICAL_BATTLE',...result});
  });

  it('suppresses duplicate completion of the same scene handoff',()=>{
    expect(buildTacticalCompletionAction(result,true)).toBeNull();
  });
});
