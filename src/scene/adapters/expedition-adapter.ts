import {reconcileActivityCheckpoint,type ExpeditionActivityCheckpoint} from '../activity-checkpoint';

export const EXPEDITION_NODES=['camp','path','crossroads','ruin','rift','treasure','encounter','return'] as const;
export type ExpeditionSceneNode=(typeof EXPEDITION_NODES)[number];

const nodeSet=new Set<string>(EXPEDITION_NODES);

export function sanitizeExpeditionNode(raw:unknown):ExpeditionSceneNode{
  return typeof raw==='string'&&nodeSet.has(raw)?raw as ExpeditionSceneNode:'camp';
}

export function reconcileExpeditionCheckpoint(checkpoint:ExpeditionActivityCheckpoint,hasCanonicalBattleProof:boolean):ExpeditionActivityCheckpoint{
  const safe:ExpeditionActivityCheckpoint={...checkpoint,step:sanitizeExpeditionNode(checkpoint.step)};
  if(safe.phase==='encounter'&&hasCanonicalBattleProof)return {...safe,phase:'post_encounter'};
  return reconcileActivityCheckpoint(safe,hasCanonicalBattleProof) as ExpeditionActivityCheckpoint;
}
