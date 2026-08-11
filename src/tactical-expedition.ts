import {createBattleSession,type TacticalUnit,BattleResult} from './tactical-battle';
import {deriveCompanionUnit,type CompanionId,type LeaderCombatProgression} from './tactical-companions';
import type {EnemyArchetype} from './tactical-ai';
export type TacticalBattleNode={stageId:string;enemyArchetypes:[EnemyArchetype,EnemyArchetype,EnemyArchetype];level:number};
const archetypes:EnemyArchetype[]=['brute','guardian','hexer','medic','assassin'];
export function tacticalBattleNodeForStage(stageId:string):TacticalBattleNode{let hash=0;for(const c of stageId)hash=(hash*31+c.charCodeAt(0))>>>0;return {stageId,enemyArchetypes:[archetypes[hash%5],archetypes[(hash+2)%5],archetypes[(hash+4)%5]],level:1+(hash%10)};}
const runa=(p:LeaderCombatProgression):TacticalUnit=>({id:'runa',side:'ally',position:'front',maxHp:p.maxHp,hp:p.maxHp,agility:p.agility,ap:3,maxAp:3,mp:0,maxMp:10,shield:0});
export function createTacticalExpeditionBattle(stageId:string,selected:readonly CompanionId[],p:LeaderCombatProgression,seed:number){if(selected.length!==2||selected[0]===selected[1])throw new Error('Two companions required');const node=tacticalBattleNodeForStage(stageId);const allies=[runa(p),...selected.map(id=>deriveCompanionUnit(id,p))];const enemies=node.enemyArchetypes.map((_,i):TacticalUnit=>{const hp=70+node.level*8;return {id:`${stageId}-enemy-${i+1}`,side:'enemy',position:i===2?'back':'front',maxHp:hp,hp,agility:8+node.level+i,ap:3,maxAp:3,mp:0,maxMp:10,shield:0};});return createBattleSession(allies,enemies,seed);}
export function resolveTacticalExpeditionReward(stageId:string,result:BattleResult){let hash=0;for(const c of stageId)hash=(hash+c.charCodeAt(0))>>>0;return result==='victory'?{coins:80+hash%41,bondXp:12,expeditionScore:100+hash%51}:{coins:0,bondXp:3,expeditionScore:0};}
