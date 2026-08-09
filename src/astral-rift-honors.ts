import { astralRiftDefinitions, type AstralRiftRecordMap } from './astral-rift';

export type AstralRiftHonorId = 'first_rift_clear'|'six_rifts'|'six_rifts_s'|'full_intensity';

export const astralRiftHonors = [
  { id:'first_rift_clear' as const, label:'첫 균열 돌파', reward:{ gold:250, gems:0 } },
  { id:'six_rifts' as const, label:'육성운 정복', reward:{ gold:0, gems:2 } },
  { id:'six_rifts_s' as const, label:'별빛 완전 정복', reward:{ gold:600, gems:2 } },
  { id:'full_intensity' as const, label:'18단 균열 연대기', reward:{ gold:1200, gems:4 } },
];

export function astralRiftHonorProgress(records:AstralRiftRecordMap) {
  const clearedRifts = new Set<string>();
  const sRifts = new Set<string>();
  let clearedCombinations = 0;
  for (const [key,record] of Object.entries(records)) {
    const [riftId,intensity] = key.split(':');
    if (!astralRiftDefinitions.some(item => item.id === riftId) || !['1','2','3'].includes(intensity)) continue;
    clearedCombinations += 1;
    clearedRifts.add(riftId);
    if (record.grade === 'S') sRifts.add(riftId);
  }
  return { clearedRifts:clearedRifts.size, sRifts:sRifts.size, clearedCombinations };
}

export function newlyEarnedAstralRiftHonors(records:AstralRiftRecordMap,claimed:AstralRiftHonorId[]) {
  const progress = astralRiftHonorProgress(records);
  return astralRiftHonors.filter(item => {
    if (claimed.includes(item.id)) return false;
    if (item.id === 'first_rift_clear') return progress.clearedCombinations >= 1;
    if (item.id === 'six_rifts') return progress.clearedRifts >= 6;
    if (item.id === 'six_rifts_s') return progress.sRifts >= 6;
    return progress.clearedCombinations >= 18;
  });
}
