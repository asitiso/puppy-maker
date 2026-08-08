export type SeasonMasteryRankId = 'sprout'|'traveler'|'chronicler'|'guardian'|'eternal';
export type SeasonMasteryRank = {
  id:SeasonMasteryRankId;
  label:string;
  description:string;
  score:number;
  threshold:number;
  nextThreshold:number|null;
};

const definitions = [
  { id:'sprout' as const, label:'새싹 계절지기', description:'계절 여정을 막 기록하기 시작했어요.', threshold:0 },
  { id:'traveler' as const, label:'계절 여행자', description:'여러 계절의 기억을 모으고 있어요.', threshold:5 },
  { id:'chronicler' as const, label:'사계절 기록자', description:'계절의 흐름을 하나의 연대기로 만들고 있어요.', threshold:12 },
  { id:'guardian' as const, label:'별빛 계절수호자', description:'완주와 수집을 꾸준히 이어온 숙련 수호자예요.', threshold:24 },
  { id:'eternal' as const, label:'영원의 계절수호자', description:'수많은 계절의 기억을 지켜낸 최고 등급이에요.', threshold:40 },
];

export function seasonMasteryScore(input:{ completedSeasons:number; keepsakes:number; honors:number }):number {
  const completed = Number.isFinite(input.completedSeasons) ? Math.max(0,Math.floor(input.completedSeasons)) : 0;
  const keepsakes = Number.isFinite(input.keepsakes) ? Math.max(0,Math.floor(input.keepsakes)) : 0;
  const honors = Number.isFinite(input.honors) ? Math.max(0,Math.floor(input.honors)) : 0;
  return completed * 3 + keepsakes + honors * 4;
}

export function seasonMasteryRank(rawScore:number):SeasonMasteryRank {
  const score = Number.isFinite(rawScore) ? Math.max(0,Math.floor(rawScore)) : 0;
  let index = 0;
  for (let candidate = 0; candidate < definitions.length; candidate += 1) {
    if (score >= definitions[candidate].threshold) index = candidate;
  }
  const current = definitions[index];
  return {
    ...current,
    score,
    nextThreshold:definitions[index + 1]?.threshold ?? null,
  };
}
