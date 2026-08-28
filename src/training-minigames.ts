import type {ActivityId} from './game';

export type PlayableTrainingActivity=Exclude<ActivityId,'rest'>;
export type TrainingActionKind='attack'|'dodge'|'charge';
export type TrainingPresentationGrade='clean'|'good'|'recovered';
export type MagicRune='✦'|'◇'|'✧'|'○';
export type HerbToken='별이끼'|'달빛풀'|'반짝잎';

export type TrainingChallenge={
  difficulty:number;
  presentationGradeFloor:TrainingPresentationGrade;
  timingWindow:number;
  previewMs:number;
  sequenceLength:number;
  distractorCloseness:number;
};

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

export function challengeForRound(activity:PlayableTrainingActivity,seed:number,round:number):TrainingChallenge{
  const safeRound=Math.max(0,Math.min(4,Math.trunc(Number.isFinite(round)?round:0)));
  const seedJitter=(Math.abs(Math.trunc(Number.isFinite(seed)?seed:0))%11)/250;
  const activityBias=activity==='herb'?.04:activity==='magic'?.02:0;
  const difficulty=Math.min(.95,.34+safeRound*.2+seedJitter+activityBias);
  const presentationGradeFloor:TrainingPresentationGrade=safeRound>=2?'good':'recovered';
  return {
    difficulty,
    presentationGradeFloor,
    timingWindow:Math.max(.07,.15-safeRound*.035),
    previewMs:Math.max(850,1500-safeRound*250),
    sequenceLength:Math.min(6,3+safeRound),
    distractorCloseness:Math.min(.95,.34+safeRound*.24+activityBias),
  };
}

export function magicPatternForRound(seed:number,round:number):MagicRune[]{
  const length=challengeForRound('magic',seed,round).sequenceLength;
  const base=Math.abs(Math.trunc(seed))+round*7;
  return Array.from({length},(_,index)=>magicRunes[(base+index*3+round)%magicRunes.length]);
}

export function herbOrderForRound(seed:number,round:number):HerbToken[]{
  return rotate(herbs,Math.abs(Math.trunc(seed))+round);
}
