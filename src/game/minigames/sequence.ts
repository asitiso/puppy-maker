// Magic training: memorize a short rune sequence, then tap it back in
// order. Deterministic given the `random` source so it's testable and
// replayable — no reliance on Math.random inside the pure logic.
export type RuneId = 0 | 1 | 2 | 3;

export function generateSequence(length: number, random: () => number = Math.random): RuneId[] {
  const sequence: RuneId[] = [];
  for (let i = 0; i < length; i++) sequence.push(Math.floor(random() * 4) as RuneId);
  return sequence;
}

// Position-by-position match against the target, scored out of the
// target's length. A shorter input counts its missing tail as wrong;
// extra input beyond the target length is ignored (the player already
// finished the sequence, further taps don't matter).
export function sequenceAccuracy(target: RuneId[], input: RuneId[]): number {
  if (target.length === 0) return 1;
  let correct = 0;
  for (let i = 0; i < target.length; i++) if (input[i] === target[i]) correct++;
  return correct / target.length;
}
