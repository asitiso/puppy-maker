export type StoryActivityCheckpoint={
  activity:'story';
  activityId:string;
  phase:'intro'|'dialogue'|'choice'|'post_choice';
  step:string;
};

export type TrainingActivityCheckpoint={
  activity:'training';
  activityId:string;
  phase:'intro'|'activity'|'post_commit';
  step:string;
};

export type ExpeditionActivityCheckpoint={
  activity:'expedition';
  activityId:string;
  phase:'node'|'encounter'|'post_encounter'|'reward'|'post_reward';
  step:string;
};

export type ActivityCheckpoint=StoryActivityCheckpoint|TrainingActivityCheckpoint|ExpeditionActivityCheckpoint;

const PHASES={
  story:new Set<StoryActivityCheckpoint['phase']>(['intro','dialogue','choice','post_choice']),
  training:new Set<TrainingActivityCheckpoint['phase']>(['intro','activity','post_commit']),
  expedition:new Set<ExpeditionActivityCheckpoint['phase']>(['node','encounter','post_encounter','reward','post_reward']),
};

function isRecord(value:unknown):value is Record<string,unknown>{
  return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}

function cleanText(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const cleaned=value.trim();
  return cleaned.length>0?cleaned:null;
}

export function sanitizeActivityCheckpoint(raw:unknown):ActivityCheckpoint|null{
  if(!isRecord(raw))return null;
  const activity=raw.activity;
  const activityId=cleanText(raw.activityId);
  const step=cleanText(raw.step);
  const phase=raw.phase;
  if(!activityId||!step||typeof phase!=='string')return null;
  if(activity==='story'&&PHASES.story.has(phase as StoryActivityCheckpoint['phase'])){
    return {activity,activityId,phase:phase as StoryActivityCheckpoint['phase'],step};
  }
  if(activity==='training'&&PHASES.training.has(phase as TrainingActivityCheckpoint['phase'])){
    return {activity,activityId,phase:phase as TrainingActivityCheckpoint['phase'],step};
  }
  if(activity==='expedition'&&PHASES.expedition.has(phase as ExpeditionActivityCheckpoint['phase'])){
    return {activity,activityId,phase:phase as ExpeditionActivityCheckpoint['phase'],step};
  }
  return null;
}

export function reconcileActivityCheckpoint(checkpoint:ActivityCheckpoint|null,hasCanonicalCommitProof:boolean):ActivityCheckpoint|null{
  if(!checkpoint||hasCanonicalCommitProof)return checkpoint;
  if(checkpoint.activity==='story'&&checkpoint.phase==='post_choice')return {...checkpoint,phase:'choice'};
  if(checkpoint.activity==='training'&&checkpoint.phase==='post_commit')return {...checkpoint,phase:'activity'};
  if(checkpoint.activity==='expedition'&&checkpoint.phase==='post_encounter')return {...checkpoint,phase:'encounter'};
  if(checkpoint.activity==='expedition'&&checkpoint.phase==='post_reward')return {...checkpoint,phase:'reward'};
  return checkpoint;
}
