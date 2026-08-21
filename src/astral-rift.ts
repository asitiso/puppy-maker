export type AstralRiftId =
  | 'nebula_garden'
  | 'lunar_ruins'
  | 'comet_pass'
  | 'eclipse_vault'
  | 'starforge_core'
  | 'empyrean_gate';

export type AstralRiftIntensity = 1|2|3;
export type AstralRiftGrade = 'C'|'B'|'A'|'S';

export type AstralRiftDefinition = {
  id:AstralRiftId;
  label:string;
  ascensionThreshold:number;
  baseTargetPower:number;
};

export type AstralRiftRecord = {
  grade:Exclude<AstralRiftGrade,'C'>;
  bestPower:number;
  clearCount:number;
};

export type AstralRiftRecordMap = Record<string,AstralRiftRecord>;

export const astralRiftDefinitions:AstralRiftDefinition[] = [
  { id:'nebula_garden', label:'성운의 정원', ascensionThreshold:12, baseTargetPower:60 },
  { id:'lunar_ruins', label:'월광 유적', ascensionThreshold:12, baseTargetPower:80 },
  { id:'comet_pass', label:'혜성의 길', ascensionThreshold:28, baseTargetPower:105 },
  { id:'eclipse_vault', label:'일식의 금고', ascensionThreshold:28, baseTargetPower:125 },
  { id:'starforge_core', label:'별대장간 핵', ascensionThreshold:48, baseTargetPower:150 },
  { id:'empyrean_gate', label:'천궁의 문', ascensionThreshold:72, baseTargetPower:175 },
];

const gradeRank:Record<Exclude<AstralRiftGrade,'C'>,number> = { B:1, A:2, S:3 };
const intensityBonus:Record<AstralRiftIntensity,number> = { 1:0, 2:35, 3:70 };
const baseEchoes:Record<AstralRiftIntensity,number> = { 1:4, 2:7, 3:11 };
const gradeEchoes:Record<Exclude<AstralRiftGrade,'C'>,number> = { B:0, A:2, S:4 };

const clampInt = (value:number,min:number,max:number) => Math.min(max,Math.max(min,Number.isFinite(value) ? Math.floor(value) : min));
const recordKey = (riftId:AstralRiftId,intensity:AstralRiftIntensity) => `${riftId}:${intensity}`;

export function nextAstralRiftUnlock(rawAscensionScore:number) {
  const score = clampInt(rawAscensionScore,0,83);
  const thresholds = astralRiftDefinitions
    .map(item => item.ascensionThreshold)
    .filter(threshold => threshold > score);
  if (thresholds.length === 0) return null;
  const threshold = Math.min(...thresholds);
  return {
    threshold,
    remaining:threshold - score,
    riftIds:astralRiftDefinitions.filter(item => item.ascensionThreshold === threshold).map(item => item.id),
  };
}

export function astralRiftPower(input:{
  ascensionScore:number;
  sanctuaryGrandProgress:number;
  callingMasteryLevel:number;
  blessingCount:number;
}):number {
  return clampInt(input.ascensionScore,0,83) * 2
    + clampInt(input.sanctuaryGrandProgress,0,65)
    + clampInt(input.callingMasteryLevel,0,5) * 8
    + clampInt(input.blessingCount,0,4) * 10;
}

export function astralRiftChallenge(riftId:AstralRiftId,intensity:AstralRiftIntensity) {
  const definition = astralRiftDefinitions.find(item => item.id === riftId);
  if (!definition) throw new Error(`Unknown Astral Rift: ${riftId}`);
  return { ...definition, intensity, targetPower:definition.baseTargetPower + intensityBonus[intensity] };
}

export function canEnterAstralRift(input:{
  riftId:AstralRiftId;
  intensity:AstralRiftIntensity;
  ascensionScore:number;
  records:AstralRiftRecordMap;
}):boolean {
  const challenge = astralRiftChallenge(input.riftId,input.intensity);
  const ascensionScore = clampInt(input.ascensionScore,0,83);
  if (ascensionScore < challenge.ascensionThreshold) return false;
  if (input.intensity === 1) return true;
  const previous = input.records[recordKey(input.riftId,(input.intensity - 1) as AstralRiftIntensity)];
  return Boolean(previous && gradeRank[previous.grade] >= gradeRank.A);
}

export function resolveAstralRift(
  riftId:AstralRiftId,
  intensity:AstralRiftIntensity,
  rawPower:number,
  firstClear:boolean,
) {
  const power = Math.max(0,Number.isFinite(rawPower) ? Math.floor(rawPower) : 0);
  const target = astralRiftChallenge(riftId,intensity).targetPower;
  let grade:AstralRiftGrade = 'C';
  if (power >= target + 30) grade = 'S';
  else if (power >= target + 10) grade = 'A';
  else if (power >= target) grade = 'B';
  if (grade === 'C') return { grade, success:false as const, echoes:0 };
  const echoes = baseEchoes[intensity] + gradeEchoes[grade] + (firstClear ? 3 : 0);
  return { grade, success:true as const, echoes };
}

export function updateAstralRiftRecord(
  records:AstralRiftRecordMap,
  riftId:AstralRiftId,
  intensity:AstralRiftIntensity,
  result:{ grade:Exclude<AstralRiftGrade,'C'>; power:number },
):AstralRiftRecordMap {
  const key = recordKey(riftId,intensity);
  const previous = records[key];
  const power = Math.max(0,Number.isFinite(result.power) ? Math.floor(result.power) : 0);
  if (!previous) {
    return { ...records, [key]:{ grade:result.grade, bestPower:power, clearCount:1 } };
  }
  return {
    ...records,
    [key]:{
      grade:gradeRank[result.grade] > gradeRank[previous.grade] ? result.grade : previous.grade,
      bestPower:Math.max(previous.bestPower,power),
      clearCount:previous.clearCount + 1,
    },
  };
}
