import type {BattleSession} from './tactical-battle';
import type {TacticalActionId} from './tactical-actions';
import {drawBattleHand} from './tactical-cards';

export const TACTICAL_ACTION_DECK:readonly TacticalActionId[]=['attack','attack','attack','skill','skill','support','support','special'];

function actorHash(actorId:string){let hash=0;for(const char of actorId)hash=(hash*31+char.charCodeAt(0))>>>0;return hash;}

export function tacticalActionHand(session:BattleSession,actorId:string):TacticalActionId[]{
  const seed=(session.seed*1664525+session.round*1013+session.acted.length*97+actorHash(actorId))>>>0;
  return drawBattleHand(seed,[...TACTICAL_ACTION_DECK],4) as TacticalActionId[];
}
