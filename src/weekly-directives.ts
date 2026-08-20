export type WeeklyDirectiveCounter = 'training'|'outing'|'gift'|'expedition'|'high_grade';
export type WeeklyDirectiveId =
  | 'steady_training'
  | 'field_patrol'
  | 'warm_bond'
  | 'guardian_sortie'
  | 'elite_clear'
  | 'deep_training'
  | 'adventure_week'
  | 'gift_week';

export type WeeklyDirective = {
  id:WeeklyDirectiveId;
  label:string;
  counter:WeeklyDirectiveCounter;
  target:number;
  reward:{ journeyPoints:number; tokens:number };
};

export type WeeklyDirectiveEvent = {
  kind:'training'|'outing'|'gift'|'expedition';
  grade?:'S'|'A'|'B'|'C';
};

const directivePool: WeeklyDirective[] = [
  { id:'steady_training', label:'성장의 리듬', counter:'training', target:2, reward:{ journeyPoints:15, tokens:4 } },
  { id:'field_patrol', label:'바깥 세상 순찰', counter:'outing', target:2, reward:{ journeyPoints:15, tokens:4 } },
  { id:'warm_bond', label:'마음을 나누는 주간', counter:'gift', target:2, reward:{ journeyPoints:15, tokens:4 } },
  { id:'guardian_sortie', label:'수호자 출정', counter:'expedition', target:2, reward:{ journeyPoints:20, tokens:5 } },
  { id:'elite_clear', label:'정예 도전', counter:'high_grade', target:1, reward:{ journeyPoints:20, tokens:5 } },
  { id:'deep_training', label:'집중 훈련', counter:'training', target:3, reward:{ journeyPoints:20, tokens:5 } },
  { id:'adventure_week', label:'모험의 발걸음', counter:'outing', target:3, reward:{ journeyPoints:20, tokens:5 } },
  { id:'gift_week', label:'선물의 온기', counter:'gift', target:3, reward:{ journeyPoints:20, tokens:5 } },
];

export function weeklyDirectiveKey(year:number, month:number, week:number) {
  return `${Math.max(1,Math.floor(year))}-${Math.max(1,Math.min(12,Math.floor(month)))}-${Math.max(1,Math.min(4,Math.floor(week)))}` as const;
}

export function weeklyDirectives(year:number, month:number, week:number): WeeklyDirective[] {
  const seed = Math.max(0,Math.floor(year * 37 + month * 11 + week * 5));
  const result: WeeklyDirective[] = [];
  let cursor = seed % directivePool.length;
  while (result.length < 3) {
    const candidate = directivePool[cursor % directivePool.length];
    if (!result.some(item => item.id === candidate.id || item.counter === candidate.counter)) result.push(candidate);
    cursor += 3;
  }
  return result;
}

function matches(directive:WeeklyDirective, event:WeeklyDirectiveEvent) {
  if (directive.counter === 'high_grade') return event.kind === 'expedition' && (event.grade === 'S' || event.grade === 'A');
  return directive.counter === event.kind;
}

export function advanceWeeklyDirectives(
  directives:WeeklyDirective[],
  progress:Record<string,number>,
  event:WeeklyDirectiveEvent,
  rewardedKeys:string[] = [],
  key?:string,
) {
  const next = { ...progress };
  const completed: WeeklyDirective[] = [];
  let journeyPoints = 0;
  let tokens = 0;

  for (const directive of directives) {
    const before = Math.max(0,Math.floor(next[directive.id] ?? 0));
    const after = matches(directive,event) ? Math.min(directive.target,before + 1) : before;
    next[directive.id] = after;
    const reached = after >= directive.target;
    const justCompleted = before < directive.target && reached;
    const rewardKey = key ? `${key}:${directive.id}` : null;
    const shouldReward = key
      ? reached && !rewardedKeys.includes(rewardKey!)
      : justCompleted;
    if (shouldReward) {
      completed.push(directive);
      journeyPoints += directive.reward.journeyPoints;
      tokens += directive.reward.tokens;
    }
  }

  return { progress:next, completed, reward:{ journeyPoints, tokens } };
}
