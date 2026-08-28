import type {BattleResult} from '../../tactical-battle';
import type {CompanionId} from '../../tactical-companions';
import type {TacticalEncounterId} from '../../tactical-encounters';

export type TacticalCompletionInput={
  encounterId:TacticalEncounterId;
  result:BattleResult;
  rounds:number;
  survivingAllies:number;
  damageTaken:number;
  companions?:readonly CompanionId[];
};

export type TacticalCompletionAction={
  type:'COMPLETE_TACTICAL_BATTLE';
  encounterId:TacticalEncounterId;
  result:BattleResult;
  rounds:number;
  survivingAllies:number;
  damageTaken:number;
  companions?:CompanionId[];
};

export function buildTacticalCompletionAction(input:TacticalCompletionInput,alreadyCommitted:boolean):TacticalCompletionAction|null{
  if(alreadyCommitted)return null;
  return {
    type:'COMPLETE_TACTICAL_BATTLE',
    encounterId:input.encounterId,
    result:input.result,
    rounds:input.rounds,
    survivingAllies:input.survivingAllies,
    damageTaken:input.damageTaken,
    ...(input.companions?{companions:[...input.companions]}:{}),
  };
}
