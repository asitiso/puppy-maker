import { describe, expect, it, vi } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { closeTacticalFlow } from './TacticalExpeditionFlow';

describe('tactical game persistence integration', () => {
  it('hydrates old saves with safe tactical defaults and sanitizes party/bonds', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      selectedTacticalCompanions:['bear','bear','bogus','owl'],
      tacticalCompanionBonds:{ bear:{xp:999}, owl:{xp:80}, wolf:{xp:-3} },
      tacticalAutoBattle:true,
      tacticalBattleSpeed:2,
    });
    expect(hydrated.selectedTacticalCompanions).toEqual(['bear','owl']);
    expect(hydrated.tacticalCompanionBonds.bear).toEqual({xp:300,level:5});
    expect(hydrated.tacticalCompanionBonds.owl.level).toBe(3);
    expect(hydrated.tacticalCompanionBonds.wolf).toEqual({xp:0,level:1});
    expect(hydrated.tacticalAutoBattle).toBe(true);
    expect(hydrated.tacticalBattleSpeed).toBe(2);
  });

  it('sets exactly two distinct tactical companions and stores battle preferences', () => {
    const party = reducer(initialState,{type:'SET_TACTICAL_PARTY',companions:['bear','owl']});
    expect(party.selectedTacticalCompanions).toEqual(['bear','owl']);
    expect(reducer(party,{type:'SET_TACTICAL_PARTY',companions:['bear','bear']})).toBe(party);
    const prefs = reducer(party,{type:'SET_TACTICAL_PREFERENCES',auto:true,speed:2});
    expect(prefs.tacticalAutoBattle).toBe(true);
    expect(prefs.tacticalBattleSpeed).toBe(2);
  });

  it('grants participating companion bond and first-clear rewards exactly once', () => {
    const ready = reducer(initialState,{type:'SET_TACTICAL_PARTY',companions:['bear','owl']});
    const first = reducer(ready,{type:'COMPLETE_TACTICAL_BATTLE',encounterId:'training_ground',result:'victory',rounds:4,survivingAllies:3,damageTaken:40,companions:['bear','owl']});
    expect(first.tacticalCompanionBonds.bear.xp).toBeGreaterThan(0);
    expect(first.tacticalCompanionBonds.owl.xp).toBeGreaterThan(0);
    expect(first.tacticalCompanionBonds.wolf.xp).toBe(0);
    expect(first.claimedTacticalFirstClears).toContain('training_ground');
    const goldAfterFirst = first.gold;
    const second = reducer(first,{type:'COMPLETE_TACTICAL_BATTLE',encounterId:'training_ground',result:'victory',rounds:4,survivingAllies:3,damageTaken:40,companions:['bear','owl']});
    expect(second.claimedTacticalFirstClears.filter(id=>id==='training_ground')).toHaveLength(1);
    expect(second.gold - goldAfterFirst).toBeLessThan(first.gold - ready.gold);
  });

  it('does not pay victory rewards on defeat but still grants small participation bond', () => {
    const ready = reducer(initialState,{type:'SET_TACTICAL_PARTY',companions:['wolf','cat']});
    const lost = reducer(ready,{type:'COMPLETE_TACTICAL_BATTLE',encounterId:'training_ground',result:'defeat',rounds:8,survivingAllies:0,damageTaken:300,companions:['wolf','cat']});
    expect(lost.gold).toBe(ready.gold);
    expect(lost.gems).toBe(ready.gems);
    expect(lost.claimedTacticalFirstClears).toEqual([]);
    expect(lost.tacticalCompanionBonds.wolf.xp).toBeGreaterThan(0);
    expect(lost.tacticalCompanionBonds.cat.xp).toBeGreaterThan(0);
  });

  it('closes the tactical battle state and outer expedition before returning home', () => {
    const order:string[] = [];
    const clearSession = vi.fn(() => order.push('session'));
    const closeBattle = vi.fn(() => order.push('battle'));
    const returnHome = vi.fn(() => order.push('home'));
    closeTacticalFlow(clearSession,closeBattle,returnHome);
    expect(order).toEqual(['session','battle','home']);
    expect(clearSession).toHaveBeenCalledOnce();
    expect(closeBattle).toHaveBeenCalledOnce();
    expect(returnHome).toHaveBeenCalledOnce();
  });
});