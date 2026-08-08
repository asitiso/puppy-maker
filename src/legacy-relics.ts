import { annualHonor } from './annual-honors';
import type { AnnualRecord } from './annual-records';

export type LegacyRelicId = 'first_chronicle' | 'seasonal_crown' | 'three_year_seal' | 'honor_prism' | 'starlight_chronicle';

export type LegacyRelicDefinition = {
  id: LegacyRelicId;
  label: string;
  description: string;
};

export const legacyRelicDefinitions: LegacyRelicDefinition[] = [
  { id:'first_chronicle', label:'첫 연대기의 깃펜', description:'첫 번째 연간 수호 기록을 완성한다.' },
  { id:'seasonal_crown', label:'사계의 왕관', description:'한 해에 네 계절 인장을 모두 모은다.' },
  { id:'three_year_seal', label:'세 해의 봉인', description:'연간 수호 기록을 3개 남긴다.' },
  { id:'honor_prism', label:'명예의 프리즘', description:'서로 다른 특별 연간 휘장을 3종 모은다.' },
  { id:'starlight_chronicle', label:'별빛 연대기', description:'연간 수호 기록을 5개 남긴다.' },
];

export function unlockedLegacyRelics(records: AnnualRecord[]): LegacyRelicId[] {
  const unlocked = new Set<LegacyRelicId>();
  if (records.length >= 1) unlocked.add('first_chronicle');
  if (records.some(record => record.seasonStamps >= 4)) unlocked.add('seasonal_crown');
  if (records.length >= 3) unlocked.add('three_year_seal');

  const specialHonors = new Set(
    records
      .map(record => annualHonor(record).id)
      .filter(id => id !== 'balanced_guardian'),
  );
  if (specialHonors.size >= 3) unlocked.add('honor_prism');
  if (records.length >= 5) unlocked.add('starlight_chronicle');

  return legacyRelicDefinitions.map(item => item.id).filter(id => unlocked.has(id));
}
