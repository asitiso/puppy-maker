import type { GuardianCallingId } from './guardian-callings';
import type { AstralRiftRecordMap } from './astral-rift';

export type CelestialGuardianId = 'dawn_stag'|'moon_crane'|'storm_wolf'|'star_fox';
export type ConvergenceIntensity = 1|2|3;
export type ConvergenceGrade = 'C'|'B'|'A'|'S';

export type CelestialGuardianDefinition = {
  id:CelestialGuardianId;
  label:string;
  callingAffinity:GuardianCallingId;
  mappedRift:string;
  baseTargetPower:number;
};

export type ConvergenceRecord = {
  grade:Exclude<ConvergenceGrade,'C'>;
  bestPower:number;
  clearCount:number;
};

export type ConvergenceRecordMap = Record<string,ConvergenceRecord>;

export const celestialGuardianDefinitions:CelestialGuardianDefinition[] = [
  { id:'dawn_stag', label:'새벽의 사슴', callingAffinity:'vanguard', mappedRift:'starforge_core', baseTargetPower:210 },
  { id:'moon_crane', label:'월광의 학', callingAffinity:'arcanist', mappedRift:'lunar_ruins', baseTargetPower:225 },
  { id:'storm_wolf', label:'폭풍의 늑대', callingAffinity:'pathfinder', mappedRift:'comet_pass', baseTargetPower:240 },
  { id:'star_fox', label:'별빛의 여우', callingAffinity:'caretaker', mappedRift:'nebula_garden', baseTargetPower:255 },
];

const intensityBonus:Record<ConvergenceIntensity,number> = { 1:0, 2:45, 3:90 };
const gradeRank:Record<Exclude<ConvergenceGrade,'C'>,number> = { B:1, A:2, S:3 };
const gradeSigils:Record<Exclude<ConvergenceGrade,'C'>,number> = { B:2, A:3, S:5 };
const clampInt = (value:number,min:number,max:number) => Math.min(max,Math.max(min,Number.isFinite(value) ? Math.floor(value) : min));

function definitionFor(id:CelestialGuardianId) {
  const definition = celestialGuardianDefinitions.find(item => item.id === id);
  if (!definition) throw new Error(`Unknown Celestial Guardian: ${id}`);
  return definition;
}

export function convergenceChallenge(guardianId:CelestialGuardianId,intensity:ConvergenceIntensity) {
  const definition = definitionFor(guardianId);
  return { ...definition, guardianId, intensity, targetPower:definition.baseTargetPower + intensityBonus[intensity] };
}

export function astralRiftClearCount(records:AstralRiftRecordMap):number {
  return Object.values(records).reduce((sum,record) => sum + Math.max(0,Math.floor(record.clearCount ?? 0)),0);
}

export function convergencePower(input:{
  ascensionScore:number;
  sanctuaryGrandProgress:number;
  callingMasteryLevel:number;
  astralRiftClearCount:number;
  riftRelicCount:number;
  activeCalling:GuardianCallingId|null;
  guardianId:CelestialGuardianId;
}):number {
  const affinity = definitionFor(input.guardianId).callingAffinity === input.activeCalling ? 12 : 0;
  return clampInt(input.ascensionScore,0,200) * 2
    + clampInt(input.sanctuaryGrandProgress,0,200)
    + clampInt(input.callingMasteryLevel,0,5) * 5
    + clampInt(input.astralRiftClearCount,0,999) * 2
    + clampInt(input.riftRelicCount,0,99) * 4
    + affinity;
}

export function canEnterConvergence(input:{
  guardianId:CelestialGuardianId;
  intensity:ConvergenceIntensity;
  riftRecords:AstralRiftRecordMap;
  riftRelicCount:number;
}):boolean {
  const clears = astralRiftClearCount(input.riftRecords);
  if (input.intensity === 1) return clears >= 6;
  if (input.intensity === 2) {
    const mappedRift = definitionFor(input.guardianId).mappedRift;
    return Boolean(input.riftRecords[`${mappedRift}:2`]);
  }
  return clears >= 12 && clampInt(input.riftRelicCount,0,99) >= 6;
}

export function resolveConvergence(
  guardianId:CelestialGuardianId,
  intensity:ConvergenceIntensity,
  rawPower:number,
  firstClear:boolean,
) {
  const power = Math.max(0,Number.isFinite(rawPower) ? Math.floor(rawPower) : 0);
  const target = convergenceChallenge(guardianId,intensity).targetPower;
  let grade:ConvergenceGrade = 'C';
  if (power >= target + 50) grade = 'S';
  else if (power >= target + 20) grade = 'A';
  else if (power >= target) grade = 'B';
  if (grade === 'C') return { grade, success:false as const, sigils:0 };
  return { grade, success:true as const, sigils:gradeSigils[grade] + (firstClear ? 3 : 0) };
}

export function updateConvergenceRecord(
  records:ConvergenceRecordMap,
  guardianId:CelestialGuardianId,
  intensity:ConvergenceIntensity,
  result:{ grade:Exclude<ConvergenceGrade,'C'>; power:number },
):ConvergenceRecordMap {
  const key = `${guardianId}:${intensity}`;
  const previous = records[key];
  const power = Math.max(0,Number.isFinite(result.power) ? Math.floor(result.power) : 0);
  if (!previous) return { ...records, [key]:{ grade:result.grade, bestPower:power, clearCount:1 } };
  return {
    ...records,
    [key]:{
      grade:gradeRank[result.grade] > gradeRank[previous.grade] ? result.grade : previous.grade,
      bestPower:Math.max(previous.bestPower,power),
      clearCount:previous.clearCount + 1,
    },
  };
}
