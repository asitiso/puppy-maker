import type {ActivityId} from './game';

export type PlayableTrainingActivity=Exclude<ActivityId,'rest'>;
export type TrainingActionKind='attack'|'dodge'|'charge';
export type MagicRune='✦'|'◇'|'✧'|'○';
export type HerbToken='별이끼'|'달빛풀'|'반짝잎';

const magicRunes:readonly MagicRune[]=['✦','◇','✧','○'];
const herbs:readonly HerbToken[]=['별이끼','달빛풀','반짝잎'];

export function buildTrainingActivityQueue(schedule:readonly ActivityId[]):PlayableTrainingActivity[]{
  return schedule.filter((activity):activity is PlayableTrainingActivity=>activity!=='rest');
}

export function trainingActionForActivity(activity:PlayableTrainingActivity):TrainingActionKind{
  if(activity==='magic')return 'charge';
  if(activity==='herb')return 'dodge';
  return 'attack';
}

function rotate<T>(values:readonly T[],offset:number):T[]{
  const normalized=((offset%values.length)+values.length)%values.length;
  return [...values.slice(normalized),...values.slice(0,normalized)];
}

export function magicPatternForRound(seed:number,round:number):MagicRune[]{
  const length=Math.min(4,3+Math.max(0,round));
  const base=Math.abs(Math.trunc(seed))+round*7;
  return Array.from({length},(_,index)=>magicRunes[(base+index*3+round)%magicRunes.length]);
}

export function herbOrderForRound(seed:number,round:number):HerbToken[]{
  return rotate(herbs,Math.abs(Math.trunc(seed))+round);
}
