import { describe, expect, it } from 'vitest';
import {
  celestialGuardianDefinitions,
  convergenceChallenge,
  convergencePower,
  canEnterConvergence,
  resolveConvergence,
  updateConvergenceRecord,
  type ConvergenceRecordMap,
} from './celestial-convergence';

const riftRecords = (entries:string[]) => Object.fromEntries(entries.map(key => [key,{ grade:'A' as const, bestPower:200, clearCount:1 }]));

describe('celestial convergence', () => {
  it('defines four guardians and twelve total intensity challenges', () => {
    expect(celestialGuardianDefinitions).toHaveLength(4);
    const challenges = celestialGuardianDefinitions.flatMap(guardian => ([1,2,3] as const).map(intensity => convergenceChallenge(guardian.id,intensity)));
    expect(challenges).toHaveLength(12);
    expect(new Set(challenges.map(item => item.guardianId)).size).toBe(4);
  });

  it('derives deterministic convergence power with calling affinity', () => {
    expect(convergencePower({
      ascensionScore:40,
      sanctuaryGrandProgress:30,
      callingMasteryLevel:3,
      astralRiftClearCount:10,
      riftRelicCount:5,
      activeCalling:'vanguard',
      guardianId:'dawn_stag',
    })).toBe(177);
    expect(convergencePower({
      ascensionScore:40,
      sanctuaryGrandProgress:30,
      callingMasteryLevel:3,
      astralRiftClearCount:10,
      riftRelicCount:5,
      activeCalling:'caretaker',
      guardianId:'dawn_stag',
    })).toBe(165);
  });

  it('gates intensities using accumulated Astral Rift progression', () => {
    const sixClears = riftRecords(['nebula_garden:1','lunar_ruins:1','comet_pass:1','eclipse_vault:1','starforge_core:1','empyrean_gate:1']);
    expect(canEnterConvergence({ guardianId:'dawn_stag', intensity:1, riftRecords:sixClears, riftRelicCount:0 })).toBe(true);
    expect(canEnterConvergence({ guardianId:'dawn_stag', intensity:2, riftRecords:sixClears, riftRelicCount:0 })).toBe(false);

    const withMappedIntensity2 = { ...sixClears, ...riftRecords(['starforge_core:2']) };
    expect(canEnterConvergence({ guardianId:'dawn_stag', intensity:2, riftRecords:withMappedIntensity2, riftRelicCount:0 })).toBe(true);

    const twelveClears = riftRecords([
      'nebula_garden:1','nebula_garden:2','lunar_ruins:1','lunar_ruins:2','comet_pass:1','comet_pass:2',
      'eclipse_vault:1','eclipse_vault:2','starforge_core:1','starforge_core:2','empyrean_gate:1','empyrean_gate:2',
    ]);
    expect(canEnterConvergence({ guardianId:'dawn_stag', intensity:3, riftRecords:twelveClears, riftRelicCount:5 })).toBe(false);
    expect(canEnterConvergence({ guardianId:'dawn_stag', intensity:3, riftRecords:twelveClears, riftRelicCount:6 })).toBe(true);
  });

  it('resolves B A S grades and grants first-clear sigils', () => {
    const challenge = convergenceChallenge('moon_crane',1);
    expect(resolveConvergence('moon_crane',1,challenge.targetPower - 1,true)).toEqual({ grade:'C', success:false, sigils:0 });
    expect(resolveConvergence('moon_crane',1,challenge.targetPower,true)).toEqual({ grade:'B', success:true, sigils:5 });
    expect(resolveConvergence('moon_crane',1,challenge.targetPower + 20,false)).toEqual({ grade:'A', success:true, sigils:3 });
    expect(resolveConvergence('moon_crane',1,challenge.targetPower + 50,false)).toEqual({ grade:'S', success:true, sigils:5 });
  });

  it('preserves best grade and power while incrementing clear count', () => {
    let records:ConvergenceRecordMap = {};
    records = updateConvergenceRecord(records,'storm_wolf',2,{ grade:'A', power:260 });
    records = updateConvergenceRecord(records,'storm_wolf',2,{ grade:'B', power:280 });
    records = updateConvergenceRecord(records,'storm_wolf',2,{ grade:'S', power:275 });
    expect(records['storm_wolf:2']).toEqual({ grade:'S', bestPower:280, clearCount:3 });
  });
});
