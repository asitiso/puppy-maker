import { isBossStage } from './expedition-bosses';
import type { ExpeditionStageId } from './expedition-regions';

export type ExpeditionStoryDefinition = {
  stageId: ExpeditionStageId;
  title: string;
  summary: string;
  bossChapter: boolean;
};

export const expeditionStoryDefinitions: ExpeditionStoryDefinition[] = [
  { stageId: 'forest_path', title: '달빛 아래 첫 발걸음', summary: '루나는 별빛 숲의 오래된 길에서 수호자의 흔적을 처음 마주했다.', bossChapter: false },
  { stageId: 'forest_glade', title: '별가루가 숨 쉬는 곳', summary: '수풀 깊은 곳의 빛이 루나의 감각과 오래된 기억을 깨웠다.', bossChapter: false },
  { stageId: 'forest_guardian', title: '고목의 시험', summary: '숲의 수호자는 힘보다 흔들리지 않는 마음을 시험했고, 루나는 첫 지역의 인정을 얻었다.', bossChapter: true },
  { stageId: 'city_square', title: '잊힌 광장의 메아리', summary: '고대 도시의 광장에서 멈춘 마법 장치들이 다시 반응하기 시작했다.', bossChapter: false },
  { stageId: 'city_gallery', title: '수정 회랑의 빛', summary: '수정 벽에 비친 루나의 마력이 새로운 길을 열었다.', bossChapter: false },
  { stageId: 'city_core', title: '봉인된 마도핵', summary: '폭주하던 마도핵을 진정시키며 루나는 지식과 힘을 함께 다루는 법을 증명했다.', bossChapter: true },
  { stageId: 'lake_channel', title: '물길을 따라', summary: '잔잔한 물길은 루나에게 속도를 늦추고 바람의 소리를 듣는 법을 가르쳤다.', bossChapter: false },
  { stageId: 'lake_cliff', title: '바람 절벽의 약속', summary: '거센 바람 속에서도 루나는 방향을 잃지 않고 마지막 시험으로 향했다.', bossChapter: false },
  { stageId: 'lake_tempest', title: '폭풍 너머의 별빛', summary: '폭풍의 정령을 넘어선 순간 세 지역의 수호가 하나로 이어졌고, 루나의 원정은 전설의 시작이 되었다.', bossChapter: true },
];

export function storyEntryForStage(stageId: ExpeditionStageId): ExpeditionStoryDefinition {
  const entry = expeditionStoryDefinitions.find(item => item.stageId === stageId);
  if (!entry) throw new Error(`Unknown expedition story stage: ${stageId}`);
  return { ...entry, bossChapter: isBossStage(stageId) };
}
