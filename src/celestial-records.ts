import type { AstralTrialGrade } from './sanctuary-astral-trials';

export type CelestialRecord = { key:string; grade:AstralTrialGrade; power:number };
export type CelestialHonorId = 'first_light'|'full_cycle'|'perfect_cycle'|'twelve_trials';
export type CelestialHonor = {
  id:CelestialHonorId;
  label:string;
  description:string;
  metric:'totalClears'|'uniqueTrials'|'uniqueSClears';
  threshold:number;
  reward:{ gold:number; gems:number; starShards:number };
};

export const celestialHonors:CelestialHonor[] = [
  { id:'first_light', label:'첫 별빛', description:'첫 Astral Trial을 완료했어요.', metric:'totalClears', threshold:1, reward:{ gold:120, gems:0, starShards:1 } },
  { id:'full_cycle', label:'별자리 순환', description:'네 종류의 Astral Trial을 모두 완료했어요.', metric:'uniqueTrials', threshold:4, reward:{ gold:300, gems:1, starShards:2 } },
  { id:'perfect_cycle', label:'완전한 천궁', description:'네 종류의 Astral Trial에서 모두 S를 기록했어요.', metric:'uniqueSClears', threshold:4, reward:{ gold:500, gems:3, starShards:3 } },
  { id:'twelve_trials', label:'천체 연대기', description:'누적 12회의 Astral Trial을 완료했어요.', metric:'totalClears', threshold:12, reward:{ gold:800, gems:4, starShards:4 } },
];

const gradeRank:Record<AstralTrialGrade,number> = { B:1, A:2, S:3 };
const trialFromKey = (key:string) => key.split(':')[1] ?? '';
const monthFromKey = (key:string) => key.split(':')[0] ?? '';

export function canonicalCelestialRecords(records:ReadonlyArray<CelestialRecord>):CelestialRecord[] {
  const byMonth = new Map<string,CelestialRecord>();
  for (const record of records) {
    const month = monthFromKey(record.key);
    const trial = trialFromKey(record.key);
    if (!month || !trial) continue;
    const existing = byMonth.get(month);
    if (!existing) {
      byMonth.set(month,record);
      continue;
    }
    if (existing.key !== record.key) continue;
    if (gradeRank[record.grade] > gradeRank[existing.grade]
      || (record.grade === existing.grade && record.power > existing.power)) {
      byMonth.set(month,record);
    }
  }
  return [...byMonth.values()];
}

export function celestialRecordProgress(records:ReadonlyArray<CelestialRecord>) {
  const canonical = canonicalCelestialRecords(records);
  const unique = new Set<string>();
  const uniqueS = new Set<string>();
  for (const record of canonical) {
    const trial = trialFromKey(record.key);
    if (!trial) continue;
    unique.add(trial);
    if (record.grade === 'S') uniqueS.add(trial);
  }
  return { totalClears:canonical.length, uniqueTrials:unique.size, uniqueSClears:uniqueS.size };
}

export function newlyEarnedCelestialHonors(records:ReadonlyArray<CelestialRecord>,claimed:ReadonlyArray<CelestialHonorId>) {
  const progress = celestialRecordProgress(records);
  return celestialHonors.filter(item => progress[item.metric] >= item.threshold && !claimed.includes(item.id));
}
