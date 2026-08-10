import {describe,expect,it} from 'vitest';
import {buildTimeline,canPlayCard,resolveCard,seededDraw,type BattleUnit,type BattleCard} from './tactical-battle-core';
const unit=(id:string,agility:number,hp=100):BattleUnit=>({id,name:id,side:'ally',role:'leader',row:'front',hp,maxHp:100,shield:0,ap:2,mp:0,agility,power:20,magic:20,statuses:[]});
describe('tactical battle core',()=>{
 it('orders timeline by agility with deterministic id ties',()=>expect(buildTimeline([unit('b',10),unit('a',10),unit('c',20)]).map(x=>x.id)).toEqual(['c','a','b']));
 it('draws the same four cards for the same seed',()=>{const deck=['a','b','c','d','e','f'];expect(seededDraw(deck,42,4)).toEqual(seededDraw(deck,42,4));expect(seededDraw(deck,42,4)).toHaveLength(4)});
 it('checks and spends AP/MP while resolving damage',()=>{const card:BattleCard={id:'strike',name:'Strike',family:'attack',ap:1,mp:0,target:'enemy',effect:{kind:'damage',amount:20}};const actor=unit('runa',10);const enemy={...unit('enemy',5),side:'enemy' as const};expect(canPlayCard(actor,card)).toBe(true);const result=resolveCard(actor,enemy,card);expect(result.actor.ap).toBe(1);expect(result.target.hp).toBe(80)});
});
