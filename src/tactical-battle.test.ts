import { describe, expect, it } from 'vitest';
import { createBattleSession, isBattleFinished, orderedTimeline, type TacticalUnit } from './tactical-battle';

const unit = (id:string, side:'ally'|'enemy', agility:number, hp=100):TacticalUnit => ({
  id, side, position:'front', maxHp:100, hp, agility, ap:3, maxAp:3, mp:0, maxMp:10, shield:0,
});

describe('tactical battle domain', () => {
  it('creates a 3v3 session with stable initial timeline', () => {
    const allies = [unit('runa','ally',12), unit('bear','ally',6), unit('owl','ally',8)];
    const enemies = [unit('wolf_e','enemy',10), unit('tree_e','enemy',4), unit('bat_e','enemy',14)];
    const session = createBattleSession(allies,enemies,17);
    expect(session.units).toHaveLength(6);
    expect(session.timeline).toEqual(['bat_e','runa','wolf_e','owl','bear','tree_e']);
    expect(session.round).toBe(1);
  });

  it('rejects duplicate unit ids before timeline or acted state can become ambiguous', () => {
    const allies = [unit('runa','ally',12), unit('bear','ally',6), unit('owl','ally',8)];
    const enemies = [unit('runa','enemy',10), unit('tree_e','enemy',4), unit('bat_e','enemy',14)];
    expect(() => createBattleSession(allies,enemies,17)).toThrow('unique unit ids');
  });

  it('rejects blank unit ids that would be mistaken for no active actor', () => {
    const allies = [unit(' ','ally',12), unit('bear','ally',6), unit('owl','ally',8)];
    const enemies = [unit('wolf_e','enemy',10), unit('tree_e','enemy',4), unit('bat_e','enemy',14)];
    expect(() => createBattleSession(allies,enemies,17)).toThrow('non-empty unit ids');
  });

  it('rejects non-string runtime unit ids without crashing while validating them', () => {
    const corrupted = { ...unit('runa','ally',12),id:42 } as unknown as TacticalUnit;
    const allies = [corrupted,unit('bear','ally',6),unit('owl','ally',8)];
    const enemies = [unit('wolf_e','enemy',10),unit('tree_e','enemy',4),unit('bat_e','enemy',14)];
    expect(() => createBattleSession(allies,enemies,17)).toThrow('non-empty unit ids');
  });

  it('rejects party-side mismatches before they can corrupt win/loss state', () => {
    const allies = [unit('runa','ally',12), unit('bear','enemy',6), unit('owl','ally',8)];
    const enemies = [unit('wolf_e','enemy',10), unit('tree_e','enemy',4), unit('bat_e','enemy',14)];
    expect(() => createBattleSession(allies,enemies,17)).toThrow('party sides');
  });

  it('normalizes unusable max AP to at least one so a battle cannot pass forever', () => {
    const zeroAp = (id:string,side:'ally'|'enemy',agility:number):TacticalUnit => ({...unit(id,side,agility),ap:0,maxAp:0});
    const session = createBattleSession(
      [zeroAp('runa','ally',12),zeroAp('bear','ally',6),zeroAp('owl','ally',8)],
      [zeroAp('wolf_e','enemy',10),zeroAp('tree_e','enemy',4),zeroAp('bat_e','enemy',14)],
      17,
    );
    expect(session.units.every(entry => entry.maxAp >= 1)).toBe(true);
  });

  it('caps finite-but-huge battle values to safe integers before downstream arithmetic', () => {
    const huge:TacticalUnit={
      ...unit('runa','ally',Number.MAX_VALUE,Number.MAX_VALUE),
      maxHp:Number.MAX_VALUE,
      shield:Number.MAX_VALUE,
      attackPower:Number.MAX_VALUE,
      skillPower:Number.MAX_VALUE,
      supportPower:Number.MAX_VALUE,
    };
    const session=createBattleSession(
      [huge,unit('bear','ally',6),unit('owl','ally',8)],
      [unit('wolf_e','enemy',10),unit('tree_e','enemy',4),unit('bat_e','enemy',14)],
      Number.MAX_VALUE,
    );
    const runa=session.units.find(entry=>entry.id==='runa')!;
    for(const value of [runa.maxHp,runa.hp,runa.agility,runa.shield,runa.attackPower!,runa.skillPower!,runa.supportPower!,session.seed]) {
      expect(Number.isSafeInteger(value)).toBe(true);
    }
  });

  it('breaks equal-agility ties by stable unit id', () => {
    expect(orderedTimeline([unit('z','ally',10),unit('a','enemy',10),unit('m','ally',11)])).toEqual(['m','a','z']);
  });

  it('preserves front/back placement', () => {
    const runa = { ...unit('runa','ally',10), position:'back' as const };
    const session = createBattleSession([runa,unit('bear','ally',5),unit('cat','ally',15)],[unit('e1','enemy',1),unit('e2','enemy',2),unit('e3','enemy',3)],1);
    expect(session.units.find(entry => entry.id === 'runa')?.position).toBe('back');
  });

  it('detects victory and defeat only when a whole side is down', () => {
    const base = createBattleSession([unit('runa','ally',10),unit('bear','ally',5),unit('cat','ally',15)],[unit('e1','enemy',1),unit('e2','enemy',2),unit('e3','enemy',3)],1);
    expect(isBattleFinished(base)).toBeNull();
    expect(isBattleFinished({ ...base, units:base.units.map(entry => entry.side === 'enemy' ? { ...entry, hp:0 } : entry) })).toBe('victory');
    expect(isBattleFinished({ ...base, units:base.units.map(entry => entry.side === 'ally' ? { ...entry, hp:0 } : entry) })).toBe('defeat');
  });

  it('treats non-finite runtime HP as non-living so an untargetable unit cannot deadlock the battle', () => {
    const base = createBattleSession([unit('runa','ally',10),unit('bear','ally',5),unit('cat','ally',15)],[unit('e1','enemy',1),unit('e2','enemy',2),unit('e3','enemy',3)],1);
    const lastEnemyCorrupted = {
      ...base,
      units:base.units.map(entry => entry.side === 'enemy' ? { ...entry,hp:entry.id === 'e1' ? Number.POSITIVE_INFINITY : 0 } : entry),
    };
    expect(isBattleFinished(lastEnemyCorrupted)).toBe('victory');
    expect(orderedTimeline(lastEnemyCorrupted.units)).not.toContain('e1');

    const lastAllyCorrupted = {
      ...base,
      units:base.units.map(entry => entry.side === 'ally' ? { ...entry,hp:entry.id === 'runa' ? Number.NaN : 0 } : entry),
    };
    expect(isBattleFinished(lastAllyCorrupted)).toBe('defeat');
    expect(orderedTimeline(lastAllyCorrupted.units)).not.toContain('runa');
  });
});