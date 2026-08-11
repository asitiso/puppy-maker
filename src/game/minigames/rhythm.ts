// Rest training: a slow breathing circle (long period, calm pacing —
// deliberately the opposite feel of hunt's fast timing ring). Tap when
// the circle is fully expanded (phase 1, the "peak" at half the cycle).
// phase(t) is a triangle wave: 0 at the trough (cycle start/end), 1 at
// the peak (half-cycle).
export function breathPhase(elapsedMs: number, periodMs: number): number {
  const t = ((elapsedMs % periodMs) + periodMs) % periodMs; // normalize, safe for negative input
  const half = periodMs / 2;
  return t <= half ? t / half : 2 - t / half;
}

export function breathAccuracy(elapsedMs: number, periodMs: number): number {
  return breathPhase(elapsedMs, periodMs);
}
