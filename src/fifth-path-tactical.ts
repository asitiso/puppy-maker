import type {BattleResult,BattleSession} from './tactical-battle';
import type {CompanionId,LeaderCombatProgression} from './tactical-companions';
import {createTacticalExpeditionBattle} from './tactical-expedition';
import type {TacticalEncounterId} from './tactical-encounters';
import type {FifthPathSeason} from './fifth-path-runtime';

export type FifthPathTacticalScenario={
  id:string;
  campaign:'true_path';
  season:FifthPathSeason;
  stageId:TacticalEncounterId;
  failForward:true;
};

export const fifthPathTacticalScenarios:readonly FifthPathTacticalScenario[]=[
  {id:'fifth_summer_echo_convergence',campaign:'true_path',season:'summer',stageId:'starlight_patrol',failForward:true},
  {id:'fifth_autumn_world_reweave',campaign:'true_path',season:'autumn',stageId:'rift_vanguard',failForward:true},
  {id:'fifth_winter_last_possibility',campaign:'true_path',season:'winter',stageId:'rift_vanguard',failForward:true},
];

export function createFifthPathBattle(
  scenario:FifthPathTacticalScenario,
  selected:readonly CompanionId[],
  progression:LeaderCombatProgression,
  seed:number,
):BattleSession{
  return createTacticalExpeditionBattle(scenario.stageId,selected,progression,seed);
}

const safeInt=(value:number,max=Number.MAX_SAFE_INTEGER)=>
  Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;

export function resolveFifthTacticalTerminalResult(
  scenario:FifthPathTacticalScenario,
  input:{
    attemptKey:string;
    battleResult:BattleResult;
    rounds:number;
    survivingAllies:number;
    damageTaken:number;
  },
){
  const attemptKey=typeof input.attemptKey==='string'?input.attemptKey.trim():'';
  if(!attemptKey)throw new Error('Fifth Tactical attempt key is required');
  return {
    scenarioId:scenario.id,
    campaign:'true_path' as const,
    season:scenario.season,
    attemptKey,
    terminalKey:`${scenario.id}:${attemptKey}`,
    objectiveResult:(input.battleResult==='victory'?'success':'failure') as 'success'|'failure',
    battleResult:input.battleResult,
    failForward:true as const,
    rounds:safeInt(input.rounds),
    survivingAllies:safeInt(input.survivingAllies,3),
    damageTaken:safeInt(input.damageTaken),
  };
}
