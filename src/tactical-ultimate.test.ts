import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { combinationUltimateFor, resolveCombinationUltimate, validCombinationUltimateTargets } from './tactical-ultimate';

const unit = (id:string, side:'ally'|'enemy', agility:number, mp=0, hp=100):TacticalUnit => ({
  id, side, position:'front', maxHp:100, hp, agility, ap:3, maxAp:3, mp, maxMp:10, shield:0,
});

function battle(partner:'bear'|'owl'|'wolf'|'cat'='wolf', runaMp=10) {
  const supportId = partner === 'owl' ? 'companion-bear' : 'companion-owl';
  const partnerHp = partner === 'owl' ? 60 : 100;
  return createBattleSession(
    [unit('runa','ally',20,runaMp),unit(`companion-${partner}`,'ally',12,0,partnerHp),unit(supportId,'ally',8)],
    [unit('enemy-front','enemy',10),unit('enemy-back','enemy',7),unit('enemy-third','enemy',5)],
    17,
  );
}

describe('bond level five combination ultimates', () => {
  it('defines the four approved Runa + companion identities', () => {
    expect(['bear','owl','wolf','cat'].map(id => combinationUltimateFor(id as 'bear'|'owl'|'wolf'|'cat').label)).toEqual([
      'Starlight Guardian Formation',
      'Moonlight Prayer',
      'Twin Moon Assault',
      'Phantom Dance',
    ]);
  });

  it('stays locked below Bond Lv5 and preserves the exact session object', () => {
    const session = battle('wolf');
    expect(resolveCombinationUltimate(session,{ actorId:'runa', companionId:'wolf', bondLevel:4, targetId:'enemy-front' })).toBe(session);
  });

  it('rejects non-finite bond levels instead of bypassing the Lv5 gate', () => {
    const session = battle('wolf');
    for (const bondLevel of [Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]) {
      expect(validCombinationUltimateTargets(session,'runa','wolf',bondLevel)).toEqual([]);
      expect(resolveCombinationUltimate(session,{ actorId:'runa', companionId:'wolf', bondLevel, targetId:'enemy-front' })).toBe(session);
    }
  });

  it('stays locked one MP below the charge boundary without spending a turn', () => {
    const session = battle('wolf',9);
    expect(validCombinationUltimateTargets(session,'runa','wolf',5)).toEqual([]);
    expect(resolveCombinationUltimate(session,{ actorId:'runa', companionId:'wolf', bondLevel:5, targetId:'enemy-front' })).toBe(session);
    expect(session.units.find(unit => unit.id === 'runa')?.mp).toBe(9);
    expect(session.acted).toEqual([]);
  });

  it('resolves Twin Moon Assault once, resets MP to zero, and blocks same-turn reuse', () => {
    const session = battle('wolf',10);
    expect(validCombinationUltimateTargets(session,'runa','wolf',5)).toContain('enemy-front');
    const next = resolveCombinationUltimate(session,{ actorId:'runa', companionId:'wolf', bondLevel:5, targetId:'enemy-front' });
    expect(next).not.toBe(session);
    expect(next.units.find(unit => unit.id === 'enemy-front')?.hp).toBeLessThan(45);
    expect(next.units.find(unit => unit.id === 'runa')?.mp).toBe(0);
    expect(next.acted).toEqual(['runa']);
    expect(next.units.find(unit => unit.id === 'companion-wolf')?.ap).toBe(3);
    expect(validCombinationUltimateTargets(next,'runa','wolf',5)).toEqual([]);
    expect(resolveCombinationUltimate(next,{ actorId:'runa', companionId:'wolf', bondLevel:5, targetId:'enemy-back' })).toBe(next);
  });

  it('requires the matching living companion and a legal target', () => {
    const session = battle('wolf');
    const withoutPartner = { ...session, units:session.units.map(unit => unit.id === 'companion-wolf' ? { ...unit,hp:0 } : unit) };
    expect(resolveCombinationUltimate(withoutPartner,{ actorId:'runa', companionId:'wolf', bondLevel:5, targetId:'enemy-front' })).toBe(withoutPartner);
    expect(resolveCombinationUltimate(session,{ actorId:'runa', companionId:'wolf', bondLevel:5, targetId:'runa' })).toBe(session);
  });

  it('gives each partner a distinct team effect without reviving dead allies', () => {
    const bear = battle('bear');
    const bearNext = resolveCombinationUltimate(bear,{ actorId:'runa', companionId:'bear', bondLevel:5, targetId:'runa' });
    expect(bearNext.units.filter(unit => unit.side === 'ally').every(unit => unit.shield >= 24)).toBe(true);

    const owl = battle('owl');
    const owlNext = resolveCombinationUltimate(owl,{ actorId:'runa', companionId:'owl', bondLevel:5, targetId:'companion-owl' });
    expect(owlNext.units.find(unit => unit.id === 'companion-owl')?.hp).toBeGreaterThan(60);
    expect(owlNext.units.find(unit => unit.id === 'companion-owl')?.statuses).toContainEqual({ id:'regen',turns:2 });

    const owlWithDeadAlly = battle('owl');
    owlWithDeadAlly.units = owlWithDeadAlly.units.map(entry => entry.id === 'companion-bear' ? { ...entry,hp:0 } : entry);
    const owlDeadNext = resolveCombinationUltimate(owlWithDeadAlly,{ actorId:'runa', companionId:'owl', bondLevel:5, targetId:'companion-owl' });
    expect(owlDeadNext.units.find(unit => unit.id === 'companion-bear')?.hp).toBe(0);

    const cat = battle('cat');
    const catNext = resolveCombinationUltimate(cat,{ actorId:'runa', companionId:'cat', bondLevel:5, targetId:'enemy-front' });
    expect(catNext.units.find(unit => unit.id === 'enemy-front')?.statuses).toContainEqual({ id:'break',turns:2 });
  });
});
