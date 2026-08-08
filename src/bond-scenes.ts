import type { GuardianRankId } from './guardian-rank';

export type BondSceneId =
  | 'first_trust' | 'favorite_place' | 'shared_secret' | 'training_promise' | 'gift_memory'
  | 'guardian_confession' | 'first_boss_together' | 'three_regions_together' | 'year_together' | 'precious_partner';

export type BondSceneDefinition = {
  id: BondSceneId;
  title: string;
  summary: string;
  reward: { gold: number; gems: number };
};

export const bondSceneDefinitions: BondSceneDefinition[] = [
  { id:'first_trust', title:'처음 내민 마음', summary:'루나가 먼저 곁으로 다가와 조용히 기대었다.', reward:{ gold:100, gems:0 } },
  { id:'favorite_place', title:'좋아하는 장소', summary:'둘만 기억하는 작은 외출 장소가 생겼다.', reward:{ gold:100, gems:0 } },
  { id:'shared_secret', title:'둘만의 비밀', summary:'루나가 아무에게도 하지 않았던 이야기를 들려주었다.', reward:{ gold:150, gems:0 } },
  { id:'training_promise', title:'함께한 약속', summary:'많은 훈련 끝에 서로를 믿고 끝까지 함께하기로 약속했다.', reward:{ gold:150, gems:0 } },
  { id:'gift_memory', title:'마음을 담은 선물', summary:'수많은 선물보다 함께 나눈 마음이 더 오래 남았다.', reward:{ gold:200, gems:0 } },
  { id:'guardian_confession', title:'수호자의 고백', summary:'정식 수호자가 된 루나가 자신의 꿈을 처음 말했다.', reward:{ gold:0, gems:1 } },
  { id:'first_boss_together', title:'첫 보스를 넘어서', summary:'두려운 시험 앞에서도 둘은 서로를 놓지 않았다.', reward:{ gold:0, gems:1 } },
  { id:'three_regions_together', title:'세 지역의 기억', summary:'세 지역의 끝까지 함께 걸어온 여정이 하나의 추억이 되었다.', reward:{ gold:0, gems:1 } },
  { id:'year_together', title:'한 해를 함께', summary:'한 해의 마지막 장에 서로의 이름이 나란히 남았다.', reward:{ gold:0, gems:1 } },
  { id:'precious_partner', title:'소중한 동반자', summary:'루나는 이제 주인을 단순한 훈련 상대가 아닌 평생의 동반자로 생각한다.', reward:{ gold:0, gems:1 } },
];

export const bondSceneIds = bondSceneDefinitions.map(item => item.id);
const rankOrder: GuardianRankId[] = ['trainee','junior','guardian','veteran','starlight'];

export type BondSceneProgress = {
  affection: number;
  outings: number;
  trainings: number;
  gifts: number;
  guardianRank: GuardianRankId;
  bossClears: number;
  annualRecords: number;
  alreadyUnlocked: BondSceneId[];
};

export function eligibleBondScenes(progress: BondSceneProgress): BondSceneId[] {
  const eligible = new Set<BondSceneId>();
  if (progress.affection >= 55) eligible.add('first_trust');
  if (progress.affection >= 65 && progress.outings >= 1) eligible.add('favorite_place');
  if (progress.affection >= 75) eligible.add('shared_secret');
  if (progress.affection >= 75 && progress.trainings >= 10) eligible.add('training_promise');
  if (progress.affection >= 80 && progress.gifts >= 5) eligible.add('gift_memory');
  if (progress.affection >= 85 && rankOrder.indexOf(progress.guardianRank) >= rankOrder.indexOf('guardian')) eligible.add('guardian_confession');
  if (progress.bossClears >= 1) eligible.add('first_boss_together');
  if (progress.bossClears >= 3) eligible.add('three_regions_together');
  if (progress.annualRecords >= 1) eligible.add('year_together');
  const prior = new Set([...progress.alreadyUnlocked, ...eligible]);
  if (progress.affection >= 95 && prior.size >= 8) eligible.add('precious_partner');
  return bondSceneIds.filter(id => eligible.has(id));
}
