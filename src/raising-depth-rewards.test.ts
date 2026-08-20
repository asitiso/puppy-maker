import { describe, expect, it } from 'vitest';
import { bondSceneIds } from './bond-scenes';
import { initialState, reducer } from './game';
import { reconcileBondSceneRewards } from './raising-depth-rewards';

describe('raising depth rewards and bond progression', () => {
  it('unlocks a bond scene only when the current action crosses its condition and rewards it once', () => {
    const ready = {
      ...initialState,
      stats: { ...initialState.stats, affection: 49 },
      monthlyCounters:{ ...initialState.monthlyCounters, gifts:1 },
      rewardedMonthlyMissions:['gift_once' as const],
    };
    const first = reducer(ready, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(first.unlockedBondScenes).toContain('first_trust');
    expect(first.rewardedBondScenes).toContain('first_trust');
    expect(first.gold).toBe(ready.gold + 100);

    const again = reducer(first, { type:'SET_MONTHLY_FOCUS', focus:'balanced' });
    expect(again.gold).toBe(first.gold);
    expect(again.rewardedBondScenes.filter(id => id === 'first_trust')).toHaveLength(1);
  });

  it('keeps the first bond threshold exact', () => {
    const base = {
      outings:0, trainings:0, gifts:0, guardianRank:'trainee' as const,
      bossClears:0, annualRecords:0, unlocked:[], rewarded:[], gold:500, gems:2,
    };
    expect(reconcileBondSceneRewards({ ...base, affection:54 }, { ...base, affection:54 }).changed).toBe(false);
    expect(reconcileBondSceneRewards({ ...base, affection:55 }, { ...base, affection:55 }).newlyUnlocked).toEqual(['first_trust']);
  });

  it('catches up an eligible but missing bond scene and reward exactly once', () => {
    const progress = {
      affection:55,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:[],
      rewarded:[],
      gold:500,
      gems:2,
    };
    const caughtUp = reconcileBondSceneRewards(progress, progress);
    expect(caughtUp.changed).toBe(true);
    expect(caughtUp.newlyUnlocked).toEqual(['first_trust']);
    expect(caughtUp.unlocked).toEqual(['first_trust']);
    expect(caughtUp.rewarded).toEqual(['first_trust']);
    expect(caughtUp.gold).toBe(600);

    const reconciled = reconcileBondSceneRewards(
      { ...progress, unlocked:caughtUp.unlocked, rewarded:caughtUp.rewarded, gold:caughtUp.gold },
      { ...progress, unlocked:caughtUp.unlocked, rewarded:caughtUp.rewarded, gold:caughtUp.gold },
    );
    expect(reconciled.changed).toBe(false);
    expect(reconciled.gold).toBe(600);
  });

  it('catches up a missing reward for an already unlocked eligible bond scene', () => {
    const progress = {
      affection:55,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:['first_trust' as const],
      rewarded:[],
      gold:500,
      gems:2,
    };
    const caughtUp = reconcileBondSceneRewards(progress, progress);
    expect(caughtUp.changed).toBe(true);
    expect(caughtUp.newlyUnlocked).toEqual([]);
    expect(caughtUp.rewarded).toEqual(['first_trust']);
    expect(caughtUp.gold).toBe(600);

    const reconciled = reconcileBondSceneRewards(
      { ...progress, rewarded:caughtUp.rewarded, gold:caughtUp.gold },
      { ...progress, rewarded:caughtUp.rewarded, gold:caughtUp.gold },
    );
    expect(reconciled.changed).toBe(false);
    expect(reconciled.gold).toBe(600);
  });

  it('uses an existing unlock as proof for a missing reward even if the live condition later fell below the threshold', () => {
    const progress = {
      affection:0,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:['first_trust' as const],
      rewarded:[],
      gold:500,
      gems:2,
    };
    const caughtUp = reconcileBondSceneRewards(progress, progress);
    expect(caughtUp.changed).toBe(true);
    expect(caughtUp.newlyUnlocked).toEqual([]);
    expect(caughtUp.rewarded).toEqual(['first_trust']);
    expect(caughtUp.gold).toBe(600);
  });

  it('restores a missing unlock from an existing reward claim without paying twice', () => {
    const progress = {
      affection:0,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:[],
      rewarded:['first_trust' as const],
      gold:500,
      gems:2,
    };
    const repaired = reconcileBondSceneRewards(progress, progress);
    expect(repaired.changed).toBe(true);
    expect(repaired.unlocked).toEqual(['first_trust']);
    expect(repaired.rewarded).toEqual(['first_trust']);
    expect(repaired.gold).toBe(500);
    expect(repaired.gems).toBe(2);
  });

  it('canonicalizes duplicate bond state without duplicating rewards', () => {
    const progress = {
      affection:0,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:['first_trust' as const, 'first_trust' as const],
      rewarded:['first_trust' as const, 'first_trust' as const],
      gold:500,
      gems:2,
    };
    const repaired = reconcileBondSceneRewards(progress, progress);
    expect(repaired.changed).toBe(true);
    expect(repaired.unlocked).toEqual(['first_trust']);
    expect(repaired.rewarded).toEqual(['first_trust']);
    expect(repaired.gold).toBe(500);
  });

  it('can catch up every reachable bond scene in one reconciliation regardless of prior action order', () => {
    const progress = {
      affection:95,
      outings:1,
      trainings:10,
      gifts:5,
      guardianRank:'guardian' as const,
      bossClears:3,
      annualRecords:1,
      unlocked:[],
      rewarded:[],
      gold:500,
      gems:2,
    };
    const caughtUp = reconcileBondSceneRewards(progress, progress);
    expect(caughtUp.unlocked).toEqual(bondSceneIds);
    expect(caughtUp.rewarded).toEqual(bondSceneIds);
    expect(caughtUp.gold).toBe(1200);
    expect(caughtUp.gems).toBe(7);

    const stable = reconcileBondSceneRewards(
      { ...progress, unlocked:caughtUp.unlocked, rewarded:caughtUp.rewarded, gold:caughtUp.gold, gems:caughtUp.gems },
      { ...progress, unlocked:caughtUp.unlocked, rewarded:caughtUp.rewarded, gold:caughtUp.gold, gems:caughtUp.gems },
    );
    expect(stable.changed).toBe(false);
    expect(stable.gold).toBe(1200);
    expect(stable.gems).toBe(7);
  });

  it('grants one growth point every completed month and one extra for an S training month', () => {
    const normal = reducer({ ...initialState, growthPoints:0, trainingScore:650 }, { type:'NEXT_MONTH' });
    expect(normal.growthPoints).toBe(1);

    const sMonth = reducer({ ...initialState, growthPoints:0, trainingScore:950 }, { type:'NEXT_MONTH' });
    expect(sMonth.growthPoints).toBe(2);
  });

  it('grants active Calling mastery on month completion', () => {
    const state = {
      ...initialState,
      activeCalling:'vanguard' as const,
      callingHistory:['vanguard' as const],
      callingMastery:{ ...initialState.callingMastery, vanguard:2 },
    };
    const next = reducer(state, { type:'NEXT_MONTH' });
    expect(next.callingMastery.vanguard).toBe(3);
    expect(next.callingMastery.arcanist).toBe(0);
  });

  it('grants a growth point only on the first clear of each expedition boss', () => {
    const records = {
      ...initialState.expeditionRecords,
      forest_path:{ bestScore:900, bestGrade:'A' as const, cleared:true },
      forest_glade:{ bestScore:1000, bestGrade:'A' as const, cleared:true },
    };
    const ready = { ...initialState, expeditionRecords:records, growthPoints:0 };
    const first = reducer(ready, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_guardian', score:1300 });
    expect(first.growthPoints).toBe(1);
    expect(first.growthPointBossRewards).toContain('forest_guardian');

    const replay = reducer(first, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_guardian', score:1400 });
    expect(replay.growthPoints).toBe(1);
    expect(replay.growthPointBossRewards.filter(id => id === 'forest_guardian')).toHaveLength(1);
  });
});
