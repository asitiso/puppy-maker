import {describe,expect,it} from 'vitest';
import {
  TEMPEST_WARDEN,
  advanceTempestWardenPhase,
  createTempestWarden,
  isTempestWarden,
  mergeTempestWarden,
  tempestWardenPhase,
} from './tempest-warden';

describe('V18 Tempest Warden miniboss',()=>{
  it('appears only after Cloud Garden restoration and disappears permanently after defeat',()=>{
    expect(createTempestWarden(false,false)).toBeNull();
    expect(createTempestWarden(true,true)).toBeNull();
    const boss=createTempestWarden(true,false);
    expect(boss?.id).toBe(TEMPEST_WARDEN.id);
    expect(boss?.archetype).toBe('guard');
    expect(boss?.hp).toBe(TEMPEST_WARDEN.maxHp);
  });

  it('starts as a grounded guard and changes once into an airborne phase at half hp',()=>{
    const boss=createTempestWarden(true,false)!;
    expect(tempestWardenPhase(boss)).toBe(1);

    const wounded={...boss,hp:TEMPEST_WARDEN.phaseTwoHp};
    const transitioned=advanceTempestWardenPhase(wounded,()=>2);
    expect(transitioned.changed).toBe(true);
    expect(transitioned.enemy.archetype).toBe('skimmer');
    expect(transitioned.enemy.position.y).toBeGreaterThan(2);
    expect(transitioned.enemy.mode).toBe('stagger');
    expect(tempestWardenPhase(transitioned.enemy)).toBe(2);

    const duplicate=advanceTempestWardenPhase(transitioned.enemy,()=>2);
    expect(duplicate.changed).toBe(false);
  });

  it('merges idempotently into a restored field encounter set',()=>{
    const once=mergeTempestWarden([],true,false);
    const twice=mergeTempestWarden(once,true,false);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    expect(twice.every(isTempestWarden)).toBe(true);
  });
});
