export type OrphanedRunRecoveryInput={
  expeditionOpen:boolean;
  hasSession:boolean;
  hasRunSnapshot:boolean;
};

export function shouldRecoverOrphanedRunSnapshot({
  expeditionOpen,
  hasSession,
  hasRunSnapshot,
}:OrphanedRunRecoveryInput){
  return expeditionOpen&&hasRunSnapshot&&!hasSession;
}
