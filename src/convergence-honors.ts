import type { CelestialGuardianId, ConvergenceRecordMap } from './celestial-convergence';

export type ConvergenceHonorId = 'first_convergence'|'four_guardians'|'intensity_three_quartet'|'all_s_convergence';
export type ConvergenceHonor = {
  id:ConvergenceHonorId;
  label:string;
  reward:{ gold:number; gems:number };
};

export const convergenceHonors:ConvergenceHonor[] = [
  { id:'first_convergence', label:'첫 천체 합일', reward:{ gold:500, gems:0 } },
  { id:'four_guardians', label:'사방 수호의 증명', reward:{ gold:0, gems:2 } },
  { id:'intensity_three_quartet', label:'극한 수호자 정복', reward:{ gold:1000, gems:3 } },
  { id:'all_s_convergence', label:'완전한 천체 합일', reward:{ gold:1500, gems:5 } },
];

const guardians:CelestialGuardianId[] = ['dawn_stag','moon_crane','storm_wolf','star_fox'];

function hasAnyClear(records:ConvergenceRecordMap,guardian:CelestialGuardianId):boolean {
  return [1,2,3].some(intensity => Boolean(records[`${guardian}:${intensity}`]));
}

function qualifies(id:ConvergenceHonorId,records:ConvergenceRecordMap):boolean {
  const entries = Object.values(records);
  if (id === 'first_convergence') return entries.length > 0;
  if (id === 'four_guardians') return guardians.every(guardian => hasAnyClear(records,guardian));
  if (id === 'intensity_three_quartet') return guardians.every(guardian => Boolean(records[`${guardian}:3`]));
  return guardians.every(guardian => [1,2,3].every(intensity => records[`${guardian}:${intensity}`]?.grade === 'S'));
}

export function newlyEarnedConvergenceHonors(records:ConvergenceRecordMap,claimed:ConvergenceHonorId[]):ConvergenceHonor[] {
  return convergenceHonors.filter(item => qualifies(item.id,records) && !claimed.includes(item.id));
}
