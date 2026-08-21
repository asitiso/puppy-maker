import { describe, expect, it } from 'vitest';
import { pickExplorationOutcome } from './adventure';
import { effectivePathfinderExplorationXp, specialistMasteryCalling } from './calling-depth-effects';
import { resolveExpeditionFinish } from './expedition-rewards';
import { emptyExpeditionPersistentState } from './expedition-state';
import { regionalRenownLevel, renownGainForExpedition } from './regional-renown';
import { worldEvent, worldEventExpeditionBonus } from './world-event';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold:0,
  gems:0,
  affection:0,
  inventory:{ star_cookie:0, herb_tea:0, fox_charm:0 },
});

describe('adventure → exploration → guardian expedition loop', () => {
  it('keeps exploration, boss mastery, replay rewards and featured event progress aligned', () => {
    expect(pickExplorationOutcome('forest',0,[],0.5).discovery).toBeNull();
    const acceleratedXp = effectivePathfinderExplorationXp(0,'pathfinder',['pathfinder_eye']);
    expect(acceleratedXp).toBe(3);
    expect(pickExplorationOutcome('forest',acceleratedXp,[],0.5).discovery).toBe('moon_feather');

    let state = base();
    const path = resolveExpeditionFinish(state,'forest_path',700);
    expect(path.summary.firstClear).toBe(true);
    state = path.state;
    const glade = resolveExpeditionFinish(state,'forest_glade',850);
    expect(glade.summary.firstClear).toBe(true);
    state = glade.state;

    const boss = resolveExpeditionFinish(state,'forest_guardian',840);
    expect(boss.summary.grade).toBe('B');
    expect(boss.summary.cleared).toBe(true);
    expect(boss.summary.regionCompleted).toBe('starlight_forest');
    expect(specialistMasteryCalling(
      'pathfinder',
      { attack:1, dodge:1, charge:1 },
      boss.summary,
    )).toBe('pathfinder');

    const renown = renownGainForExpedition(path.summary.grade,false)
      + renownGainForExpedition(glade.summary.grade,false)
      + renownGainForExpedition(boss.summary.grade,true);
    expect(renown).toBe(7);
    expect(regionalRenownLevel(renown)).toBe(2);

    const event = worldEvent(1,4);
    expect(event.region).toBe('starlight_forest');
    expect(worldEventExpeditionBonus(event,'starlight_forest',boss.summary.grade)).toEqual({ seasonPoints:5, materialBonus:0 });

    const replay = resolveExpeditionFinish(boss.state,'forest_guardian',840);
    expect(replay.summary.cleared).toBe(true);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.state.gold).toBe(boss.state.gold);
    expect(replay.state.gems).toBe(boss.state.gems);
    expect(specialistMasteryCalling(
      'pathfinder',
      { attack:1, dodge:1, charge:1 },
      replay.summary,
    )).toBe('pathfinder');
  });
});
