import type { GameState, MemoryEntry } from '../game';
import { MEMORY_CATALOG } from './memories';

// Section 9 of the design doc: "특정 사건은 Runa의 기억으로 저장될 수 있다.
// 이후 몇 년 뒤 그 기억을 다시 언급하면 캐릭터가 실제로 성장했다는 느낌을
// 줄 수 있다." — memories were only ever written (unlockMemory) and listed
// in the album panel, never read back out into anything Runa actually
// says. This closes that loop: a memory becomes eligible for a callback
// line once it's old enough to be worth reminiscing about.
const MIN_AGE_MONTHS = 2;

function monthsElapsed(memory: MemoryEntry, year: number, month: number): number {
  return (year - memory.year) * 12 + (month - memory.month);
}

export function eligibleMemoryCallbacks(state: GameState): MemoryEntry[] {
  return state.memories.filter((memory) => monthsElapsed(memory, state.year, state.month) >= MIN_AGE_MONTHS);
}

// Same "hash the date + pick deterministically" approach selectMonthlyEvent
// already uses elsewhere in this codebase — no extra persisted "already
// shown" state needed, and it naturally rotates across eligible memories
// as months pass since the hash input changes.
export function pickMemoryCallback(state: GameState): MemoryEntry | null {
  const eligible = eligibleMemoryCallbacks(state);
  if (!eligible.length) return null;
  const index = (state.year * 17 + state.month * 7) % eligible.length;
  return eligible[index];
}

export function memoryCallbackLine(memory: MemoryEntry): string {
  const meta = MEMORY_CATALOG[memory.id];
  return `${memory.month}월의 "${meta.title}"... 그때가 기억나요.`;
}
