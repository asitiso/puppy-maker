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

  it('rejects party-side mismatches before they can corrupt win/loss state', () => {
    const allies = [unit('runa','ally',12), unit('bear','enemy',6), unit('owl','ally',8)];
    const enemies = [unit('wolf_e','enemy',10), unit('tree_e','enemy',4), unit('bat_e','enemy',14)];
    expect(() => createBattleSession(allies,enemies,17)).toThrow('party sides');
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
});
