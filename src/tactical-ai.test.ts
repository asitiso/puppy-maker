import {describe,expect,it} from 'vitest';
import {chooseEnemyAction,chooseAutoAction,type EnemyArchetype} from './tactical-ai';
import type {TacticalUnit} from './tactical-battle';
const u=(id:string,side:'ally'|'enemy',hp=100):TacticalUnit=>({id,side,position:'front',maxHp:100,hp,agility:10,ap:2,maxAp:2,mp:2,maxMp:5,shield:0});
describe('tactical ai',()=>{
 it('supports five enemy archetypes',()=>{const kinds:EnemyArchetype[]=['brute','guardian','hexer','medic','assassin'];expect(kinds.map(k=>chooseEnemyAction(k,u('e','enemy'),[u('a','ally',20),u('b','ally')],[u('e','enemy')]).kind)).toHaveLength(5)});
 it('assassin targets the lowest hp living ally',()=>expect(chooseEnemyAction('assassin',u('e','enemy'),[u('a','ally',20),u('b','ally',80)],[u('e','enemy')]).targetId).toBe('a'));
 it('medic heals the most injured living enemy',()=>expect(chooseEnemyAction('medic',u('m','enemy'),[u('a','ally')],[u('m','enemy'),u('e2','enemy',25)]).targetId).toBe('e2'));
 it('auto action chooses a legal living enemy',()=>expect(chooseAutoAction(u('runa','ally'),[u('e1','enemy',0),u('e2','enemy')]).targetId).toBe('e2'));
});
