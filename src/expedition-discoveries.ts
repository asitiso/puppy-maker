import type { ExpeditionGrade, ExpeditionStageId } from './expedition-regions';

export type ExpeditionDiscoveryId =
  | 'forest_path_discovery'
  | 'forest_glade_discovery'
  | 'forest_guardian_discovery'
  | 'city_square_discovery'
  | 'city_gallery_discovery'
  | 'city_core_discovery'
  | 'lake_channel_discovery'
  | 'lake_cliff_discovery'
  | 'lake_tempest_discovery';

export type ExpeditionDiscoveryDefinition = {
  id: ExpeditionDiscoveryId;
  stageId: ExpeditionStageId;
  label: string;
};

export const expeditionDiscoveryDefinitions: ExpeditionDiscoveryDefinition[] = [
  { id: 'forest_path_discovery', stageId: 'forest_path', label: '달빛 이끼 표본' },
  { id: 'forest_glade_discovery', stageId: 'forest_glade', label: '별가루 씨앗' },
  { id: 'forest_guardian_discovery', stageId: 'forest_guardian', label: '고목의 문장' },
  { id: 'city_square_discovery', stageId: 'city_square', label: '광장 마력석' },
  { id: 'city_gallery_discovery', stageId: 'city_gallery', label: '수정 회랑 파편' },
  { id: 'city_core_discovery', stageId: 'city_core', label: '마도핵 잔광' },
  { id: 'lake_channel_discovery', stageId: 'lake_channel', label: '은빛 물결 조각' },
  { id: 'lake_cliff_discovery', stageId: 'lake_cliff', label: '바람 절벽 깃털' },
  { id: 'lake_tempest_discovery', stageId: 'lake_tempest', label: '폭풍 정령 결정' },
];

export const expeditionDiscoveryIds = expeditionDiscoveryDefinitions.map(item => item.id);

export function discoveryForStage(stageId: ExpeditionStageId): ExpeditionDiscoveryDefinition {
  const discovery = expeditionDiscoveryDefinitions.find(item => item.stageId === stageId);
  if (!discovery) throw new Error(`Unknown expedition discovery stage: ${stageId}`);
  return discovery;
}

export function eligibleExpeditionDiscovery(stageId: ExpeditionStageId, grade: ExpeditionGrade, owned: ExpeditionDiscoveryId[]): ExpeditionDiscoveryId | null {
  if (grade === 'B' || grade === 'C') return null;
  const id = discoveryForStage(stageId).id;
  return owned.includes(id) ? null : id;
}
