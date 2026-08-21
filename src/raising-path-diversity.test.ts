import { describe, expect, it } from 'vitest';
import { initialState, reducer, type ActivityId, type GameState, type GuardianCallingId, type GrowthTraitId } from './game-base';

const routes: Array<{ calling:GuardianCallingId; schedule:ActivityId[]; traits:GrowthTraitId[] }> = [
  { calling:'vanguard', schedule:['hunt','hunt','hunt','hunt'], traits:['vanguard_power','vanguard_focus'] },
  { calling:'arcanist', schedule:['magic','magic','magic','magic'], traits:['arcanist_mana','arcanist_insight'] },
  { calling:'caretaker', schedule:['rest','rest','rest','rest'], traits:['caretaker_rest','caretaker_bond'] },
  { calling:'pathfinder', schedule:['herb','herb','herb','herb'], traits:['pathfinder_herb','pathfinder_eye'] },
];

function simulateRoute(route: (typeof routes)[number], months = 6): GameState {
  let state:GameState = {
    ...initialState,
    activeCalling:route.calling,
    callingHistory:[route.calling],
    purchasedTraits:[...route.traits],
  };
  for (let month = 0; month < months; month += 1) {
    state = reducer({ ...state, schedule:[...route.schedule], trainingScore:700 }, { type:'FINISH_TRAINING', eventRoll:0.99 });
    state = reducer(state, { type:'NEXT_MONTH' });
  }
  return state;
}

describe('multi-run Raising path diversity', () => {
  it('keeps four deliberate growth routes observably distinct after repeated months', () => {
    const results = routes.map(route => simulateRoute(route));
    const fingerprints = results.map(state => JSON.stringify({
      stats:state.stats,
      personality:state.personality,
      mastery:state.mastery,
      callingMastery:state.callingMastery,
    }));
    expect(new Set(fingerprints).size).toBe(routes.length);
  });

  it('preserves each route primary mastery instead of converging on one line', () => {
    const [vanguard, arcanist, caretaker, pathfinder] = routes.map(route => simulateRoute(route));
    expect(vanguard.mastery.hunt.xp).toBeGreaterThan(vanguard.mastery.magic.xp);
    expect(arcanist.mastery.magic.xp).toBeGreaterThan(arcanist.mastery.hunt.xp);
    expect(caretaker.mastery.rest.xp).toBeGreaterThan(caretaker.mastery.hunt.xp);
    expect(pathfinder.mastery.herb.xp).toBeGreaterThan(pathfinder.mastery.hunt.xp);
    expect(vanguard.callingMastery.vanguard).toBe(6);
    expect(arcanist.callingMastery.arcanist).toBe(6);
    expect(caretaker.callingMastery.caretaker).toBe(6);
    expect(pathfinder.callingMastery.pathfinder).toBe(6);
  });

  it('does not leak Raising identity state into a fresh run after RESET', () => {
    const completed = simulateRoute(routes[0]);
    const withBond:GameState = {
      ...completed,
      growthPoints:9,
      unlockedBondScenes:['first_trust','shared_secret'],
      rewardedBondScenes:['first_trust','shared_secret'],
    };
    const fresh = reducer(withBond, { type:'RESET' });

    expect(fresh.activeCalling).toBeNull();
    expect(fresh.callingHistory).toEqual([]);
    expect(fresh.callingMastery).toEqual({ vanguard:0, arcanist:0, caretaker:0, pathfinder:0 });
    expect(fresh.purchasedTraits).toEqual([]);
    expect(fresh.unlockedBondScenes).toEqual([]);
    expect(fresh.rewardedBondScenes).toEqual([]);
    expect(fresh.growthPoints).toBe(0);
  });
});
