import { describe, expect, it } from 'vitest';
import { resolveSeasonLegacyUnlock, seasonLegacyBoard, seasonLegacyPoints } from './season-legacy-board';

const history = [
  { key:'1-spring' as const, score:1300, tiersCompleted:10, tokensEarned:120 },
  { key:'1-summer' as const, score:1300, tiersCompleted:10, tokensEarned:120 },
];

describe('season legacy board', () => {
  it('earns one legacy point per completed season and claimed honor', () => {
    expect(seasonLegacyPoints(history,['first_complete','four_seasons'])).toBe(4);
  });

  it('requires branch prerequisites before deeper nodes', () => {
    const board = seasonLegacyBoard([]);
    expect(board.find(node => node.id === 'chronicle_seed')?.available).toBe(true);
    expect(board.find(node => node.id === 'chronicle_keeper')?.available).toBe(false);
  });

  it('spends derived points once and returns the node reward', () => {
    const first = resolveSeasonLegacyUnlock({ nodeId:'chronicle_seed', history, honors:['first_complete'], unlocked:[] });
    expect(first.accepted).toBe(true);
    expect(first.unlocked).toEqual(['chronicle_seed']);
    expect(first.remainingPoints).toBe(2);
    expect(first.reward).toEqual({ gold:150, gems:0 });
    const duplicate = resolveSeasonLegacyUnlock({ nodeId:'chronicle_seed', history, honors:['first_complete'], unlocked:first.unlocked });
    expect(duplicate.accepted).toBe(false);
  });

  it('unlocks deeper nodes only when prerequisite and points are available', () => {
    const blocked = resolveSeasonLegacyUnlock({ nodeId:'chronicle_keeper', history, honors:['first_complete'], unlocked:[] });
    expect(blocked.accepted).toBe(false);
    const ready = resolveSeasonLegacyUnlock({ nodeId:'chronicle_keeper', history, honors:['first_complete','four_seasons'], unlocked:['chronicle_seed'] });
    expect(ready.accepted).toBe(true);
    expect(ready.reward.gems).toBe(1);
  });
});
