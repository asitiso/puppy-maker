import {describe,expect,it} from 'vitest';
import {emptyTacticalPersistentState,hydrateTacticalPersistentState,grantCompanionBond} from './tactical-state';
describe('tactical persistent state',()=>{
 it('provides backward compatible defaults',()=>expect(hydrateTacticalPersistentState(null)).toEqual(emptyTacticalPersistentState()));
 it('sanitizes selected companions and bond data',()=>{const s=hydrateTacticalPersistentState({selectedCompanions:['wolf','wolf','bad'],companionBonds:{wolf:{xp:999}}});expect(s.selectedCompanions).toEqual(['wolf']);expect(s.companionBonds.wolf.level).toBe(5);expect(s.companionBonds.wolf.xp).toBe(300)});
 it('grants bond to participating companions',()=>{const s=grantCompanionBond(emptyTacticalPersistentState(),['bear','owl'],30);expect(s.companionBonds.bear.level).toBe(2);expect(s.companionBonds.owl.xp).toBe(30)});
});
