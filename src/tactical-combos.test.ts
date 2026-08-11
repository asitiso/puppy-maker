import {describe,expect,it} from 'vitest';
import {canUseCombo,comboForCompanion,resolveCombo} from './tactical-combos';
import {createBattleSession,type TacticalUnit} from './tactical-battle';
const u=(id:string,side:'ally'|'enemy',mp=5):TacticalUnit=>({id,side,position:'front',maxHp:100,hp:100,agility:10,ap:2,maxAp:2,mp,maxMp:5,shield:0});
const make=()=>createBattleSession([u('runa','ally'),u('companion-wolf','ally'),u('companion-owl','ally')],[u('e1','enemy'),u('e2','enemy'),u('e3','enemy')],7);
describe('combo ultimates',()=>{
 it('defines a combo for each companion',()=>expect(['bear','owl','wolf','cat'].map(id=>comboForCompanion(id as 'bear'|'owl'|'wolf'|'cat').id)).toHaveLength(4));
 it('requires bond five, living pair and enough mp',()=>{const s=make();expect(canUseCombo(s,'wolf',5)).toBe(true);expect(canUseCombo(s,'wolf',4)).toBe(false);expect(canUseCombo({...s,units:s.units.map(x=>x.id==='runa'?{...x,mp:0}:x)},'wolf',5)).toBe(false)});
 it('spends mp and damages the chosen enemy',()=>{const n=resolveCombo(make(),'wolf',5,'e1');expect(n.units.find(x=>x.id==='runa')?.mp).toBe(2);expect(n.units.find(x=>x.id==='e1')?.hp).toBeLessThan(100)});
});
