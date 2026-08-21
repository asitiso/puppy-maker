import { describe, expect, it } from 'vitest';
import type { CompanionId } from './tactical-companions';
import { createTacticalExpeditionBattle } from './tactical-expedition';

const progression={power:42,magic:32,agility:13,maxHp:150};
const parties:[CompanionId,CompanionId][]=[
  ['bear','owl'],['bear','wolf'],['bear','cat'],['owl','wolf'],['owl','cat'],['wolf','cat'],
];
const stages=Array.from({length:12},(_,index)=>`repeat-${index}`);

describe('Tactical Expedition repeated-run isolation',()=>{
  it('creates fresh independent battle ownership across every party pair and repeated stage run',()=>{
    for(const stageId of stages){
      for(const party of parties){
        const first=createTacticalExpeditionBattle(stageId,party,progression,77);
        const baseline=createTacticalExpeditionBattle(stageId,party,progression,77);
        expect(first).toEqual(baseline);
        expect(first).not.toBe(baseline);
        expect(first.units).not.toBe(baseline.units);
        expect(first.timeline).not.toBe(baseline.timeline);
        expect(first.acted).not.toBe(baseline.acted);

        first.units[0].hp=0;
        first.units[0].ap=0;
        first.units[0].mp=10;
        first.units[0].shield=999;
        first.acted.push(first.timeline[0]);

        const next=createTacticalExpeditionBattle(stageId,party,progression,77);
        expect(next).toEqual(baseline);
        expect(next.round).toBe(1);
        expect(next.acted).toEqual([]);
        expect(next.units.find(unit=>unit.id==='runa')?.hp).toBe(next.units.find(unit=>unit.id==='runa')?.maxHp);
        expect(next.units.find(unit=>unit.id==='runa')?.mp).toBe(0);
      }
    }
  });

  it('keeps repeated construction deterministic per seed while isolating adjacent seeds',()=>{
    for(const seed of [1,7,31,63,127]){
      const stageId=stages[seed%stages.length];
      const party=parties[seed%parties.length];
      const a=createTacticalExpeditionBattle(stageId,party,progression,seed);
      const b=createTacticalExpeditionBattle(stageId,party,progression,seed);
      const c=createTacticalExpeditionBattle(stageId,party,progression,seed+1);
      expect(a).toEqual(b);
      expect(a.seed).toBe(seed);
      expect(c.seed).toBe(seed+1);
      expect(a.acted).toEqual([]);
      expect(c.acted).toEqual([]);
    }
  });
});