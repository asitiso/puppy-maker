import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { addTacticalStatus, advanceTacticalStatuses, tacticalStatusPower } from './tactical-status';

const unit = (id:string):TacticalUnit => ({ id,side:'ally',position:'front',maxHp:100,hp:60,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0 });

describe('tactical status effects', () => {
  it('adds or refreshes a named status without duplicates', () => {
    const first = addTacticalStatus(unit('runa'),'focus',2);
    const second = addTacticalStatus(first,'focus',3);
    expect(second.statuses).toEqual([{ id:'focus', turns:3 }]);
  });

  it('sanitizes non-finite status duration instead of persisting NaN', () => {
    expect(addTacticalStatus(unit('runa'),'focus',Number.NaN).statuses).toEqual([{ id:'focus',turns:1 }]);
    expect(addTacticalStatus(unit('runa'),'regen',Number.POSITIVE_INFINITY).statuses).toEqual([{ id:'regen',turns:1 }]);
  });

  it('focus raises outgoing power while break reduces it', () => {
    expect(tacticalStatusPower(addTacticalStatus(unit('runa'),'focus',1),40)).toBe(48);
    expect(tacticalStatusPower(addTacticalStatus(unit('runa'),'break',1),40)).toBe(32);
  });

  it('does not emit non-finite combat power from corrupted raw input', () => {
    expect(tacticalStatusPower(unit('runa'),Number.NaN)).toBe(0);
    expect(tacticalStatusPower(unit('runa'),Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('regen heals at round transition and decrements durations', () => {
    let runa = addTacticalStatus(unit('runa'),'regen',2);
    runa = addTacticalStatus(runa,'guard',1);
    const next = advanceTacticalStatuses(runa);
    expect(next.hp).toBe(68);
    expect(next.statuses).toEqual([{ id:'regen', turns:1 }]);
  });

  it('guard contributes temporary shield protection', () => {
    const guarded = addTacticalStatus(unit('runa'),'guard',2);
    expect(guarded.shield).toBeGreaterThanOrEqual(15);
  });

  it('battle sessions preserve sanitized status arrays', () => {
    const runa = addTacticalStatus(unit('runa'),'focus',2);
    const session = createBattleSession([runa,unit('a2'),unit('a3')],[{...unit('e1'),side:'enemy'},{...unit('e2'),side:'enemy'},{...unit('e3'),side:'enemy'}],1);
    expect(session.units[0].statuses).toEqual([{ id:'focus', turns:2 }]);
  });

  it('drops malformed runtime status payloads instead of crashing battle creation', () => {
    const malformedArray = {
      ...unit('runa'),
      statuses:[null,{id:'focus',turns:Number.NaN},{id:'regen',turns:2},{id:'unknown',turns:3}] as unknown as TacticalUnit['statuses'],
    };
    const malformedContainer = { ...unit('a2'),statuses:'focus' as unknown as TacticalUnit['statuses'] };
    const session = createBattleSession(
      [malformedArray,malformedContainer,unit('a3')],
      [{...unit('e1'),side:'enemy'},{...unit('e2'),side:'enemy'},{...unit('e3'),side:'enemy'}],
      1,
    );
    expect(session.units.find(entry=>entry.id==='runa')?.statuses).toEqual([{id:'regen',turns:2}]);
    expect(session.units.find(entry=>entry.id==='a2')?.statuses).toEqual([]);
  });
});
