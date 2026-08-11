import {describe,expect,it} from 'vitest';
import {createTacticalExpeditionBattle,resolveTacticalExpeditionReward,tacticalBattleNodeForStage} from './tactical-expedition';
describe('tactical expedition integration',()=>{
 it('maps expedition stages to tactical battle nodes',()=>expect(tacticalBattleNodeForStage('forest-1').enemyArchetypes).toHaveLength(3));
 it('creates a legal 3v3 battle from selected companions',()=>{const b=createTacticalExpeditionBattle('forest-1',['bear','owl'],{power:30,magic:30,agility:20,maxHp:120},5);expect(b.units.filter(x=>x.side==='ally')).toHaveLength(3);expect(b.units.filter(x=>x.side==='enemy')).toHaveLength(3)});
 it('returns deterministic victory rewards',()=>expect(resolveTacticalExpeditionReward('forest-1','victory')).toEqual(resolveTacticalExpeditionReward('forest-1','victory')));
});
