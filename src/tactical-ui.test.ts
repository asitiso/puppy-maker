import {describe,expect,it} from 'vitest';
import {battleSpeedLabel,buildTacticalBattleView,formationSlotLabel} from './tactical-ui';
import {createTacticalExpeditionBattle} from './tactical-expedition';
describe('tactical battle ui model',()=>{
 it('exposes six combatants and timeline',()=>{const s=createTacticalExpeditionBattle('forest-1',['bear','owl'],{power:30,magic:30,agility:20,maxHp:120},5);const v=buildTacticalBattleView(s,false,1);expect(v.allies).toHaveLength(3);expect(v.enemies).toHaveLength(3);expect(v.timeline.length).toBe(6)});
 it('provides concise auto and speed labels',()=>{expect(battleSpeedLabel(2)).toBe('2x');expect(buildTacticalBattleView(createTacticalExpeditionBattle('forest-1',['bear','owl'],{power:30,magic:30,agility:20,maxHp:120},5),true,2).autoLabel).toBe('AUTO ON')});
 it('labels formation slots',()=>expect(formationSlotLabel('back')).toBe('BACK'));
});
