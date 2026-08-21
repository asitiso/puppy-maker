import {describe,expect,it} from 'vitest';
import {createTacticalExpeditionBattle,resolveTacticalExpeditionReward,tacticalBattleNodeForStage,tacticalExpeditionFinishScore} from './tactical-expedition';
describe('tactical expedition integration',()=>{
 it('maps expedition stages to tactical battle nodes',()=>expect(tacticalBattleNodeForStage('forest-1').enemyArchetypes).toHaveLength(3));
 it('creates a legal 3v3 battle from selected companions',()=>{const b=createTacticalExpeditionBattle('forest-1',['bear','owl'],{power:30,magic:30,agility:20,maxHp:120},5);expect(b.units.filter(x=>x.side==='ally')).toHaveLength(3);expect(b.units.filter(x=>x.side==='enemy')).toHaveLength(3)});
 it('preserves expedition enemy archetypes on live battle units',()=>{const node=tacticalBattleNodeForStage('forest-1');const b=createTacticalExpeditionBattle('forest-1',['bear','owl'],{power:30,magic:30,agility:20,maxHp:120},5);expect(b.units.filter(x=>x.side==='enemy').map(x=>x.aiArchetype)).toEqual(node.enemyArchetypes)});
 it('returns deterministic victory rewards',()=>expect(resolveTacticalExpeditionReward('forest-1','victory')).toEqual(resolveTacticalExpeditionReward('forest-1','victory')));
 it('never grants expedition score or coins on defeat',()=>expect(resolveTacticalExpeditionReward('forest-1','defeat')).toMatchObject({coins:0,expeditionScore:0}));
 it('never advances expedition stage score on tactical defeat',()=>{expect(tacticalExpeditionFinishScore(120,'defeat')).toBe(0);expect(tacticalExpeditionFinishScore(120,'victory')).toBeGreaterThan(120)});
 it('sanitizes non-finite or negative expedition finish targets',()=>{
   expect(tacticalExpeditionFinishScore(Number.NaN,'victory')).toBe(0);
   expect(tacticalExpeditionFinishScore(Number.POSITIVE_INFINITY,'victory')).toBe(0);
   expect(tacticalExpeditionFinishScore(-100,'victory')).toBe(0);
 });
});
