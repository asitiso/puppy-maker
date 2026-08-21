import {describe,expect,it} from 'vitest';
import {chooseAutoCombinationUltimate,chooseEnemyAction,chooseAutoAction,chooseTacticalEngineAction,type EnemyArchetype} from './tactical-ai';
import {createBattleSession,type TacticalUnit} from './tactical-battle';
import {tacticalActionHand} from './tactical-hand';
import type {TacticalActionId} from './tactical-actions';
const u=(id:string,side:'ally'|'enemy',hp=100):TacticalUnit=>({id,side,position:'front',maxHp:100,hp,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0});
function sessionWithHand(actor:TacticalUnit,required:TacticalActionId[],allies:TacticalUnit[]=[u('runa','ally'),u('owl','ally'),u('bear','ally')],enemyTeam:TacticalUnit[]=[actor,u('e2','enemy'),u('e3','enemy')]){
 for(let seed=1;seed<=300;seed+=1){const session=createBattleSession(allies,enemyTeam,seed);const hand=tacticalActionHand(session,actor.id);if(required.every(action=>hand.includes(action)))return session;}
 throw new Error(`Unable to find deterministic hand: ${required.join(',')}`);
}
describe('tactical ai',()=>{
 it('supports five enemy archetypes',()=>{const kinds:EnemyArchetype[]=['brute','guardian','hexer','medic','assassin'];expect(kinds.map(k=>chooseEnemyAction(k,u('e','enemy'),[u('a','ally',20),u('b','ally')],[u('e','enemy')])?.kind)).toHaveLength(5)});
 it('assassin targets the lowest hp living ally',()=>expect(chooseEnemyAction('assassin',u('e','enemy'),[u('a','ally',20),u('b','ally',80)],[u('e','enemy')])?.targetId).toBe('a'));
 it('medic heals the most injured living enemy',()=>expect(chooseEnemyAction('medic',u('m','enemy'),[u('a','ally')],[u('m','enemy'),u('e2','enemy',25)])?.targetId).toBe('e2'));
 it('auto action chooses a legal living enemy',()=>expect(chooseAutoAction(u('runa','ally'),[u('e1','enemy',0),u('e2','enemy')])?.targetId).toBe('e2'));
 it('returns no legacy enemy action when every opposing target is dead',()=>expect(chooseEnemyAction('brute',u('e','enemy'),[u('a','ally',0),u('b','ally',0)],[u('e','enemy')])).toBeNull());
 it('returns no auto action when every enemy target is dead',()=>expect(chooseAutoAction(u('runa','ally'),[u('e1','enemy',0),u('e2','enemy',0)])).toBeNull());
 it('engine AI uses SPECIAL at full MP',()=>{const actor={...u('bat','enemy'),agility:20,mp:10};const s=createBattleSession([u('runa','ally',40),u('owl','ally'),u('bear','ally')],[actor,u('e2','enemy'),u('e3','enemy')],3);expect(chooseTacticalEngineAction(s,'bat',3)?.actionId).toBe('special')});
 it('engine AI heals a critical teammate before normal attacking',()=>{const actor={...u('bat','enemy'),agility:20};const s=createBattleSession([u('runa','ally'),u('owl','ally'),u('bear','ally')],[actor,u('e2','enemy',20),u('e3','enemy')],3);expect(chooseTacticalEngineAction(s,'bat',3)).toEqual({actorId:'bat',actionId:'support',targetId:'e2'})});
 it('live medic AI heals a wounded ally before attacking',()=>{const actor={...u('medic','enemy'),agility:20,aiArchetype:'medic' as const};const s=sessionWithHand(actor,['attack','support'],undefined,[actor,u('e2','enemy',70),u('e3','enemy')]);expect(chooseTacticalEngineAction(s,'medic',1)).toEqual({actorId:'medic',actionId:'support',targetId:'e2'})});
 it('live hexer AI prioritizes SKILL when it is in hand',()=>{const actor={...u('hexer','enemy'),agility:20,aiArchetype:'hexer' as const};const s=sessionWithHand(actor,['attack','skill']);expect(chooseTacticalEngineAction(s,'hexer',1)?.actionId).toBe('skill')});
 it('live brute AI prioritizes SKILL pressure when it is in hand',()=>{const actor={...u('brute','enemy'),agility:20,aiArchetype:'brute' as const};const s=sessionWithHand(actor,['attack','skill']);expect(chooseTacticalEngineAction(s,'brute',1)?.actionId).toBe('skill')});
 it('live assassin AI uses SKILL to reach the lowest-hp back target',()=>{const actor={...u('assassin','enemy'),agility:20,aiArchetype:'assassin' as const};const back={...u('owl','ally',20),position:'back' as const};const allies=[u('runa','ally',100),u('bear','ally',80),back];const s=sessionWithHand(actor,['attack','skill'],allies);expect(chooseTacticalEngineAction(s,'assassin',1)).toEqual({actorId:'assassin',actionId:'skill',targetId:'owl'})});
 it('auto prefers a usable Bond Lv5 Runa combination ultimate',()=>{
   const runa={...u('runa','ally'),agility:30,mp:10};
   const session=createBattleSession([runa,u('companion-wolf','ally'),u('companion-owl','ally')],[u('enemy-a','enemy'),u('enemy-b','enemy',35),u('enemy-c','enemy')],11);
   expect(chooseAutoCombinationUltimate(session,['wolf','owl'],{wolf:5,owl:4})).toEqual({actorId:'runa',companionId:'wolf',bondLevel:5,targetId:'enemy-b'});
 });
 it('auto does not expose a combination ultimate below Bond Lv5',()=>{
   const runa={...u('runa','ally'),agility:30,mp:10};
   const session=createBattleSession([runa,u('companion-wolf','ally'),u('companion-owl','ally')],[u('enemy-a','enemy'),u('enemy-b','enemy'),u('enemy-c','enemy')],11);
   expect(chooseAutoCombinationUltimate(session,['wolf','owl'],{wolf:4,owl:4})).toBeNull();
 });
});
