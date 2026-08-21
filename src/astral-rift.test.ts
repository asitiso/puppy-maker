import { describe, expect, it } from 'vitest';
import {
  astralRiftDefinitions,
  astralRiftPower,
  astralRiftChallenge,
  canEnterAstralRift,
  nextAstralRiftUnlock,
  resolveAstralRift,
  updateAstralRiftRecord,
  type AstralRiftRecordMap,
} from './astral-rift';

describe('Astral Rift domain', () => {
  it('defines six ascension-gated rifts and deterministic challenge targets', () => {
    expect(astralRiftDefinitions).toHaveLength(6);
    expect(astralRiftDefinitions.map(item => item.id)).toEqual([
      'nebula_garden','lunar_ruins','comet_pass','eclipse_vault','starforge_core','empyrean_gate',
    ]);
    expect(astralRiftDefinitions.map(item => item.ascensionThreshold)).toEqual([12,12,28,28,48,72]);
    expect(astralRiftChallenge('nebula_garden',1).targetPower).toBe(60);
    expect(astralRiftChallenge('nebula_garden',3).targetPower).toBe(130);
    expect(astralRiftChallenge('empyrean_gate',3).targetPower).toBe(245);
  });

  it('reports the next Rift unlock as a clear Celestial Ascension goal', () => {
    expect(nextAstralRiftUnlock(11)).toEqual({
      threshold:12,
      remaining:1,
      riftIds:['nebula_garden','lunar_ruins'],
    });
    expect(nextAstralRiftUnlock(12)).toEqual({
      threshold:28,
      remaining:16,
      riftIds:['comet_pass','eclipse_vault'],
    });
    expect(nextAstralRiftUnlock(48)).toEqual({
      threshold:72,
      remaining:24,
      riftIds:['empyrean_gate'],
    });
    expect(nextAstralRiftUnlock(72)).toBeNull();
  });

  it('derives rift power from ascension, sanctuary, calling mastery and blessings', () => {
    expect(astralRiftPower({
      ascensionScore:28,
      sanctuaryGrandProgress:35,
      callingMasteryLevel:4,
      blessingCount:3,
    })).toBe(153);
  });

  it('requires ascension gates and A clears to unlock higher intensities', () => {
    const records:AstralRiftRecordMap = {};
    expect(canEnterAstralRift({ riftId:'nebula_garden', intensity:1, ascensionScore:11, records })).toBe(false);
    expect(canEnterAstralRift({ riftId:'nebula_garden', intensity:1, ascensionScore:12, records })).toBe(true);
    expect(canEnterAstralRift({ riftId:'nebula_garden', intensity:2, ascensionScore:12, records })).toBe(false);

    const withB = updateAstralRiftRecord(records,'nebula_garden',1,{ grade:'B', power:65 });
    expect(canEnterAstralRift({ riftId:'nebula_garden', intensity:2, ascensionScore:12, records:withB })).toBe(false);
    const withA = updateAstralRiftRecord(records,'nebula_garden',1,{ grade:'A', power:75 });
    expect(canEnterAstralRift({ riftId:'nebula_garden', intensity:2, ascensionScore:12, records:withA })).toBe(true);
  });

  it('grades deterministically and rewards echoes only for successful clears', () => {
    expect(resolveAstralRift('nebula_garden',1,59,false)).toEqual({ grade:'C', success:false, echoes:0 });
    expect(resolveAstralRift('nebula_garden',1,60,false)).toEqual({ grade:'B', success:true, echoes:4 });
    expect(resolveAstralRift('nebula_garden',1,70,false)).toEqual({ grade:'A', success:true, echoes:6 });
    expect(resolveAstralRift('nebula_garden',1,90,true)).toEqual({ grade:'S', success:true, echoes:11 });
    expect(resolveAstralRift('nebula_garden',3,160,true)).toEqual({ grade:'S', success:true, echoes:18 });
  });

  it('keeps best grade/power while counting successful replays', () => {
    let records:AstralRiftRecordMap = {};
    records = updateAstralRiftRecord(records,'nebula_garden',1,{ grade:'B', power:64 });
    expect(records['nebula_garden:1']).toEqual({ grade:'B', bestPower:64, clearCount:1 });
    records = updateAstralRiftRecord(records,'nebula_garden',1,{ grade:'A', power:73 });
    expect(records['nebula_garden:1']).toEqual({ grade:'A', bestPower:73, clearCount:2 });
    records = updateAstralRiftRecord(records,'nebula_garden',1,{ grade:'B', power:68 });
    expect(records['nebula_garden:1']).toEqual({ grade:'A', bestPower:73, clearCount:3 });
  });
});
