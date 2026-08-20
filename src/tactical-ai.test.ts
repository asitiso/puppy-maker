import {describe,expect,it} from 'vitest';
import {chooseAutoCombinationUltimate,chooseEnemyAction,chooseAutoAction,chooseTacticalEngineAction,type EnemyArchetype} from './tactical-ai';
import {createBattleSession,type TacticalUnit} from './tactical-battle';
const u=(id:string,side:'ally'|'enemy',hp=100):TacticalUnit=>({id,side,position:'front',maxHp:100,hp,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0});
describe('tactical ai',()=>{
 it('supports five enemy archetypes',()=>{const kinds:EnemyArchetype[]=['brute','guardian','hexer','medic','assassin'];expect(kinds.map(k=>chooseEnemyAction(k,u('e','enemy'),[u('a','ally',20),u('b','ally')],[u('e','enemy')]).kind)).toHaveLength(5)});
 it('assassin targets the lowest hp living ally',()=>expect(chooseEnemyAction('assassin',u('e','enemy'),[u('a','ally',20),u('b','ally',80)],[u('e','enemy')]).targetId).toBe('a'));
 it('medic heals the most injured living enemy',()=>expect(chooseEnemyAction('medic',u('m','enemy'),[u('a','ally')],[u('m','enemy'),u('e2','enemy',25)]).targetId).toBe('e2'));
 it('auto action chooses a legal living enemy',()=>expect(chooseAutoAction(u('runa','ally'),[u('e1','enemy',0),u('e2','enemy')]).targetId).toBe('e2'));
 it('engine AI uses SPECIAL at full MP',()=>{const actor={...u('bat','enemy'),agility:20,mp:10};const s=createBattleSession([u('runa','ally',40),u('owl','ally'),u('bear','ally')],[actor,u('e2','enemy'),u('e3','enemy')],3);expect(chooseTacticalEngineAction(s,'bat',3)?.actionId).toBe('special')});
 it('engine AI heals a critical teammate before normal attacking',()=>{const actor={...u('bat','enemy'),agility:20};const s=createBattleSession([u('runa','ally'),u('owl','ally'),u('bear','ally')],[actor,u('e2','enemy',20),u('e3','enemy')],3);expect(chooseTacticalEngineAction(s,'bat',3)).toEqual({actorId:'bat',actionId:'support',targetId:'e2'})});
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
