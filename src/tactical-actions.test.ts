import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { availableTacticalActions, tacticalActions, validTacticalTargets } from './tactical-actions';

const unit = (id:string, side:'ally'|'enemy', position:'front'|'back', ap=3, mp=0):TacticalUnit => ({
  id, side, position, maxHp:100, hp:100, agility:10, ap, maxAp:3, mp, maxMp:10, shield:0,
});

const session = () => createBattleSession(
  [unit('runa','ally','front'),unit('owl','ally','back'),unit('bear','ally','front')],
  [unit('wolf','enemy','front'),unit('bat','enemy','back'),unit('tree','enemy','front')],
  7,
);

describe('tactical action rules', () => {
  it('defines four action families with explicit resource costs', () => {
    expect(tacticalActions.map(action => action.id)).toEqual(['attack','skill','support','special']);
    expect(tacticalActions.find(action => action.id === 'attack')).toEqual(expect.objectContaining({ apCost:1, mpCost:0 }));
    expect(tacticalActions.find(action => action.id === 'special')).toEqual(expect.objectContaining({ apCost:0, mpCost:10 }));
  });

  it('only exposes actions the unit can afford', () => {
    expect(availableTacticalActions(unit('runa','ally','front',1,0)).map(action => action.id)).toEqual(['attack']);
    expect(availableTacticalActions(unit('runa','ally','front',3,10)).map(action => action.id)).toEqual(['attack','skill','support','special']);
  });

  it('rejects non-finite runtime battle resources instead of treating them as playable', () => {
    const corruptedAp = unit('runa','ally','front');
    corruptedAp.ap = Number.NaN;
    expect(availableTacticalActions(corruptedAp)).toEqual([]);

    const corruptedMp = session();
    corruptedMp.units = corruptedMp.units.map(entry => entry.id === 'runa' ? { ...entry,mp:Number.POSITIVE_INFINITY } : entry);
    expect(validTacticalTargets(corruptedMp,'runa','special')).toEqual([]);
  });

  it('protects enemy back-row units from direct attack while a front enemy lives', () => {
    expect(validTacticalTargets(session(),'runa','attack')).toEqual(['tree','wolf']);
    const exposed = session();
    exposed.units = exposed.units.map(entry => entry.side === 'enemy' && entry.position === 'front' ? { ...entry, hp:0 } : entry);
    expect(validTacticalTargets(exposed,'runa','attack')).toEqual(['bat']);
  });

  it('support targets living allies while skill can reach any living enemy', () => {
    expect(validTacticalTargets(session(),'runa','support')).toEqual(['bear','owl','runa']);
    expect(validTacticalTargets(session(),'runa','skill')).toEqual(['bat','tree','wolf']);
  });
});