import { describe, expect, it } from 'vitest';
import { hydrateRaisingDepthState } from './raising-depth-state';

describe('Raising Calling history hydration', () => {
  it('preserves first-seen Calling chronology instead of re-sorting by definition order', () => {
    const hydrated = hydrateRaisingDepthState({
      activeCalling:'caretaker',
      callingHistory:['pathfinder','vanguard','pathfinder','caretaker'],
    });
    expect(hydrated.callingHistory).toEqual(['pathfinder','vanguard','caretaker']);
  });

  it('restores a valid active Calling into damaged history without duplication', () => {
    const missing = hydrateRaisingDepthState({
      activeCalling:'arcanist',
      callingHistory:['vanguard','caretaker'],
    });
    expect(missing.callingHistory).toEqual(['vanguard','caretaker','arcanist']);

    const present = hydrateRaisingDepthState({
      activeCalling:'arcanist',
      callingHistory:['arcanist','vanguard','arcanist'],
    });
    expect(present.callingHistory).toEqual(['arcanist','vanguard']);
  });

  it('clears a stale monthly switch lock when no Calling is active', () => {
    const hydrated = hydrateRaisingDepthState({
      activeCalling:null,
      callingHistory:[],
      callingLastSwitchKey:'2-7',
    });
    expect(hydrated.callingLastSwitchKey).toBeNull();
  });
});
