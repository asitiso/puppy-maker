import type {BattleResult,BattleSession} from './tactical-battle';
import type {CompanionId,LeaderCombatProgression} from './tactical-companions';
import {createTacticalExpeditionBattle} from './tactical-expedition';
import type {TacticalEncounterId} from './tactical-encounters';
import type {HollowSeason,HollowSeasonObjectiveId} from './hollow-runtime';

export type HollowTacticalScenario={
  id:HollowSeasonObjectiveId;
  route:'hollow';
  season:HollowSeason;
  stageId:TacticalEncounterId;
  failForward:true;
};

export const hollowTacticalScenarios:readonly HollowTacticalScenario[]=[
  {id:'hollow_summer_predatory_shortcut',route:'hollow',season:'summer',stageId:'starlight_patrol',failForward:true},
  {id:'hollow_autumn_rift_bargain',route:'hollow',season:'autumn',stageId:'rift_vanguard',failForward:true},
  {id:'hollow_winter_veyr_convergence',route:'hollow',season:'winter',stageId:'rift_vanguard',failForward:true},
];

export function createHollowBattle(
  scenario:HollowTacticalScenario,
  selected:readonly CompanionId[],
  progression:LeaderCombatProgression,
  seed:number,
):BattleSession{
  return createTacticalExpeditionBattle(scenario.stageId,selected,progression,seed);
}

const safeInt=(value:number,max=Number.MAX_SAFE_INTEGER)=>
  Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;

export function resolveHollowTacticalTerminalResult(
  scenario:HollowTacticalScenario,
  input:{
    attemptKey:string;
    battleResult:BattleResult;
    rounds:number;
    survivingAllies:number;
    damageTaken:number;
  },
){
  const attemptKey=typeof input.attemptKey==='string'?input.attemptKey.trim():'';
  if(!attemptKey)throw new Error('Hollow Tactical attempt key is required');
  return {
    scenarioId:scenario.id,
    route:'hollow' as const,
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
