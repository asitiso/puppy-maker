export type ExpeditionRegionId = 'starlight_forest' | 'ancient_city' | 'wind_lakes';
export type ExpeditionGrade = 'S' | 'A' | 'B' | 'C';
export type ExpeditionStageId =
  | 'forest_path'
  | 'forest_glade'
  | 'forest_guardian'
  | 'city_square'
  | 'city_gallery'
  | 'city_core'
  | 'lake_channel'
  | 'lake_cliff'
  | 'lake_tempest';

export type ExpeditionStageRecord = {
  bestScore: number;
  bestGrade: ExpeditionGrade;
  cleared: boolean;
};

export type ExpeditionStageDefinition = {
  id: ExpeditionStageId;
  region: ExpeditionRegionId;
  name: string;
  target: number;
  pressure: number;
  boss: boolean;
};

export type ExpeditionRegionDefinition = {
  id: ExpeditionRegionId;
  name: string;
  stages: ExpeditionStageId[];
};

export const expeditionStageDefinitions: ExpeditionStageDefinition[] = [
  { id: 'forest_path', region: 'starlight_forest', name: '달빛 오솔길', target: 700, pressure: 8, boss: false },
  { id: 'forest_glade', region: 'starlight_forest', name: '별가루 수풀', target: 850, pressure: 11, boss: false },
  { id: 'forest_guardian', region: 'starlight_forest', name: '고목의 수호자', target: 1050, pressure: 16, boss: true },
  { id: 'city_square', region: 'ancient_city', name: '잊힌 광장', target: 950, pressure: 12, boss: false },
  { id: 'city_gallery', region: 'ancient_city', name: '수정 회랑', target: 1150, pressure: 16, boss: false },
  { id: 'city_core', region: 'ancient_city', name: '봉인된 마도핵', target: 1400, pressure: 22, boss: true },
  { id: 'lake_channel', region: 'wind_lakes', name: '잔잔한 물길', target: 1200, pressure: 15, boss: false },
  { id: 'lake_cliff', region: 'wind_lakes', name: '바람 절벽', target: 1450, pressure: 20, boss: false },
  { id: 'lake_tempest', region: 'wind_lakes', name: '폭풍의 정령', target: 1750, pressure: 28, boss: true },
];

export const expeditionRegionDefinitions: ExpeditionRegionDefinition[] = [
  { id: 'starlight_forest', name: '별빛 숲', stages: ['forest_path', 'forest_glade', 'forest_guardian'] },
  { id: 'ancient_city', name: '고대 마법도시', stages: ['city_square', 'city_gallery', 'city_core'] },
  { id: 'wind_lakes', name: '바람 호수령', stages: ['lake_channel', 'lake_cliff', 'lake_tempest'] },
];

const stageOrder = expeditionStageDefinitions.map(stage => stage.id);
const gradeRank: Record<ExpeditionGrade, number> = { C: 0, B: 1, A: 2, S: 3 };

export function emptyExpeditionRecords(): Record<ExpeditionStageId, ExpeditionStageRecord> {
  return Object.fromEntries(stageOrder.map(id => [id, { bestScore: 0, bestGrade: 'C', cleared: false }])) as Record<ExpeditionStageId, ExpeditionStageRecord>;
}

export function expeditionGrade(score: number, target: number): ExpeditionGrade {
  const safeTarget = Math.max(1, target);
  const ratio = Math.max(0, score) / safeTarget;
  if (ratio >= 1.2) return 'S';
  if (ratio >= 1) return 'A';
  if (ratio >= 0.8) return 'B';
  return 'C';
}

export function isExpeditionStageCleared(record: ExpeditionStageRecord): boolean {
  return record.cleared || gradeRank[record.bestGrade] >= gradeRank.B;
}

export function isExpeditionStageUnlocked(stageId: ExpeditionStageId, records: Record<ExpeditionStageId, ExpeditionStageRecord>): boolean {
  const index = stageOrder.indexOf(stageId);
  if (index <= 0) return index === 0;
  return isExpeditionStageCleared(records[stageOrder[index - 1]]);
}

export function updateExpeditionRecord(
  records: Record<ExpeditionStageId, ExpeditionStageRecord>,
  stageId: ExpeditionStageId,
  score: number,
  target: number,
): Record<ExpeditionStageId, ExpeditionStageRecord> {
  const current = records[stageId];
  const grade = expeditionGrade(score, target);
  const betterScore = Math.max(current.bestScore, Math.max(0, Math.floor(score)));
  const betterGrade = gradeRank[grade] > gradeRank[current.bestGrade] ? grade : current.bestGrade;
  return {
    ...records,
    [stageId]: {
      bestScore: betterScore,
      bestGrade: betterGrade,
      cleared: current.cleared || gradeRank[grade] >= gradeRank.B,
    },
  };
}

export function nextExpeditionStage(records: Record<ExpeditionStageId, ExpeditionStageRecord>): ExpeditionStageId | null {
  return stageOrder.find(id => isExpeditionStageUnlocked(id, records) && !isExpeditionStageCleared(records[id])) ?? null;
}
