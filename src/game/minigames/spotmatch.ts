// Herb-gathering training: several spots appear, one is briefly marked as
// the good herb, the rest are decoys — tap the marked one before it
// fades. A reaction/attention game, structurally unlike hunt's rhythm
// tap or magic's memory sequence.
export function pickTarget(spotCount: number, random: () => number = Math.random): number {
  return Math.min(spotCount - 1, Math.floor(random() * spotCount));
}

// Wrong pick always scores 0, regardless of how fast it was — picking a
// decoy isn't partially correct. A correct pick scores linearly by how
// much of the time limit was left (faster reaction = higher score),
// clamped to [0, 1] so an overlong reaction never goes negative.
export function spotAccuracy(target: number, picked: number, reactionMs: number, timeLimitMs: number): number {
  if (picked !== target) return 0;
  return Math.max(0, Math.min(1, 1 - reactionMs / timeLimitMs));
}
